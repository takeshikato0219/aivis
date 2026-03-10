import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
// @ts-ignore
import { isStreamURLValid } from '@types/webrtc';
import { MicState, setError, setMicState } from '@redux/slices/streamSlice';
import { useAppDispatch, useAppSelector } from '@redux/store';
import type WebView from 'react-native-webview';

// Lazy-loaded to avoid NativeEventEmitter crash at module load time
let _LiveAudioStream: any = null;
function getLiveAudioStream() {
  if (!_LiveAudioStream) {
    _LiveAudioStream = require('react-native-live-audio-stream').default;
  }
  return _LiveAudioStream;
}

export interface UseMicConfig {
  micUrl?: string;
  streamWsUrl?: string;
  autoStart?: boolean;
  webViewRef?: React.RefObject<WebView | null>;
}

export interface UseMicResult {
  micState: MicState;
  startMic: () => Promise<void>;
  stopMic: () => void;
  toggleMic: () => Promise<void>;
  handleMicMessage: (data: any) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Android: WebView MediaRecorder (audio/webm;codecs=opus)
// ─────────────────────────────────────────────────────────────────────────────

function buildStartMicJS(micUrl: string): string {
  return `
(function() {

  if (window.__micCleanup) {
    window.__micCleanup();
  }

  var wsUrl = ${JSON.stringify(micUrl)};

  wsUrl = wsUrl.includes('?') ? wsUrl + '&type=android' : wsUrl + '?type=android';

  console.log('[MicWV] WS URL:', wsUrl);

  var RawWS = (window.__origWS || window.WebSocket);

  var ws = null;
  var recorder = null;
  var stream = null;
  var stopped = false;
  var packetsSent = 0;

  var SILENCE_THRESHOLD = 0.015;
  var SILENCE_HOLD_MS = 400;

  var audioCtx = null;
  var analyser = null;
  var silenceTimer = null;
  var isSpeaking = false;

  function postState(state, extra) {
    window.ReactNativeWebView.postMessage(JSON.stringify(
      Object.assign({ type: '__mic_state', state: state }, extra || {})
    ));
  }

  function cleanup() {
    console.log('[MicWV] cleanup');

    stopped = true;

    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }

    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch(e) {}
    }

    if (stream) {
      stream.getTracks().forEach(function(t) {
        try { t.stop(); } catch(e) {}
      });
    }

    if (audioCtx) {
      try { audioCtx.close(); } catch(e) {}
      audioCtx = null;
    }

    if (ws && ws.readyState <= 1) {
      try { ws.close(); } catch(e) {}
    }

    recorder = null;
    stream = null;
    ws = null;

    window.__micCleanup = null;

    postState('stopped');
  }

  window.__micCleanup = cleanup;

  postState('connecting');

  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1
    }
  })
  .then(function(s) {

    if (stopped) {
      s.getTracks().forEach(function(t){ t.stop(); });
      return;
    }

    stream = s;

    // Setup analyser để detect silence
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      var source = audioCtx.createMediaStreamSource(stream);

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;

      source.connect(analyser);

    } catch(e) {
      console.warn('[MicWV] analyser init failed');
      analyser = null;
    }

    // Tạo websocket
    ws = new RawWS(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = function() {

      console.log('[MicWV] WS connected');

      if (stopped) {
        ws.close();
        return;
      }

      var mimeType = 'audio/webm;codecs=opus';

      try {

        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {

          recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 64000
          });

        } else {

          mimeType = 'audio/webm';

          recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 64000
          });

        }

      } catch(e) {

        console.error('[MicWV] MediaRecorder failed', e);

        postState('error', {
          error: 'MediaRecorder failed: ' + e.message
        });

        cleanup();
        return;

      }

      recorder.ondataavailable = function(ev) {

        if (!ev.data || ev.data.size === 0) return;

        if (!ws || ws.readyState !== 1) return;

        // Voice Activity Detection
        if (analyser) {

          var buf = new Uint8Array(analyser.fftSize);

          analyser.getByteTimeDomainData(buf);

          var sum = 0;

          for (var i = 0; i < buf.length; i++) {

            var val = (buf[i] - 128) / 128.0;

            sum += val * val;

          }

          var rms = Math.sqrt(sum / buf.length);

          if (rms > SILENCE_THRESHOLD) {

            isSpeaking = true;

            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }

          } else if (isSpeaking) {

            if (!silenceTimer) {

              silenceTimer = setTimeout(function() {

                isSpeaking = false;
                silenceTimer = null;

              }, SILENCE_HOLD_MS);

            }

          }

          if (!isSpeaking && !silenceTimer) {
            return;
          }

        }

        packetsSent++;

        ev.data.arrayBuffer().then(function(buf) {

          if (ws && ws.readyState === 1) {

            ws.send(buf);

          }

        });

      };

      recorder.onerror = function(e) {

        console.error('[MicWV] recorder error');

        postState('error', {
          error: 'MediaRecorder error'
        });

        cleanup();

      };

      recorder.start(100);

      console.log('[MicWV] recorder started');

      postState('streaming');

    };

    ws.onclose = function(ev) {

      console.warn('[MicWV] WS closed', ev.code);

      if (!stopped) {

        postState('error', {
          error: 'WS closed: code=' + ev.code
        });

        cleanup();

      }

    };

    ws.onerror = function() {

      console.error('[MicWV] WS error');

      if (!stopped) {

        postState('error', {
          error: 'WS connection error'
        });

        cleanup();

      }

    };

    ws.onmessage = function(ev) {

      if (typeof ev.data === 'string') {

        postState('ws_message', {
          message: ev.data.substring(0, 200)
        });

      }

    };

  })
  .catch(function(err) {

    console.error('[MicWV] getUserMedia failed', err);

    postState('error', {
      error: 'getUserMedia failed: ' + err.message
    });

    cleanup();

  });

  true;

})();
`;
}

function buildStopMicJS(): string {
  return `
(function() {
  if (window.__micCleanup) { window.__micCleanup(); }
  true;
})();
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS: Native react-native-live-audio-stream → PCMU → WebSocket
// ─────────────────────────────────────────────────────────────────────────────

// Base64 → ArrayBuffer
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < B64.length; i++) B64_LOOKUP[B64.charCodeAt(i)] = i;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const len = base64.length;
  // eslint-disable-next-line no-bitwise
  let bufLen = (len * 3) >> 2;
  if (base64[len - 1] === '=') bufLen--;
  if (base64[len - 2] === '=') bufLen--;
  const buf = new Uint8Array(bufLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = B64_LOOKUP[base64.charCodeAt(i)];
    const e2 = B64_LOOKUP[base64.charCodeAt(i + 1)];
    const e3 = B64_LOOKUP[base64.charCodeAt(i + 2)];
    const e4 = B64_LOOKUP[base64.charCodeAt(i + 3)];
    // eslint-disable-next-line no-bitwise
    buf[p++] = (e1 << 2) | (e2 >> 4);
    // eslint-disable-next-line no-bitwise
    buf[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    // eslint-disable-next-line no-bitwise
    buf[p++] = ((e3 & 3) << 6) | e4;
  }
  return buf.buffer;
}

// PCM 16-bit → G.711 μ-law
const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;

function linearToMulaw(sample: number): number {
  // eslint-disable-next-line no-bitwise
  const sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > MULAW_CLIP) sample = MULAW_CLIP;
  sample += MULAW_BIAS;
  let exponent = 7;
  // eslint-disable-next-line no-bitwise
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; exponent--, mask >>= 1) {}
  // eslint-disable-next-line no-bitwise
  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  // eslint-disable-next-line no-bitwise
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function pcm16ToMulaw(pcmBuf: ArrayBuffer): ArrayBuffer {
  const pcm = new Int16Array(pcmBuf);
  const mulaw = new Uint8Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    mulaw[i] = linearToMulaw(pcm[i]);
  }
  return mulaw.buffer;
}

/** iOS native mic: capture PCM → encode PCMU → send over WS */
class NativeMic {
  private _destroyed = false;
  private ws: WebSocket | null = null;
  private _audioStarted = false;
  private _packetsSent = 0;
  private _bytesSent = 0;
  private _lastLogTS = 0;
  onStateChange: ((s: MicState) => void) | null = null;
  onError: ((e: string) => void) | null = null;

  start(url: string) {
    this._destroyed = false;
    console.log('[MicNative] start() — PCMU 8kHz mode');
    console.log('[MicNative] URL:', url.substring(0, 100));

    try {
      getLiveAudioStream().init({
        sampleRate: 8000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        wavFile: '',
        bufferSize: 4096,
      });
      getLiveAudioStream().on('data', this._onAudioData);
      this._connectWS(url);
    } catch (e) {
      console.error('[MicNative] Init failed:', e);
      this.onError?.('Failed to initialize microphone');
    }
  }

  destroy() {
    console.log('[MicNative] destroy() — packets:', this._packetsSent, 'bytes:', this._bytesSent);
    this._destroyed = true;
    if (this._audioStarted) {
      try {
        getLiveAudioStream().stop();
      } catch {
        /* ignore */
      }
      this._audioStarted = false;
    }
    if (this.ws) {
      this.ws.onopen = this.ws.onclose = this.ws.onmessage = this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.onStateChange = null;
    this.onError = null;
  }

  private _onAudioData = (base64Data: string) => {
    if (this._destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      const pcmBuf = base64ToArrayBuffer(base64Data);
      const mulawBuf = pcm16ToMulaw(pcmBuf);
      this.ws.send(mulawBuf);
      this._packetsSent++;
      this._bytesSent += mulawBuf.byteLength;
      const now = Date.now();
      if (this._packetsSent <= 3) {
        console.log(`[MicNative] Packet #${this._packetsSent}: PCMU ${mulawBuf.byteLength}B`);
      } else if (now - this._lastLogTS > 5000) {
        this._lastLogTS = now;
        console.log(`[MicNative] flowing: packets=${this._packetsSent} bytes=${this._bytesSent}`);
      }
    } catch (e) {
      if (this._packetsSent < 5) console.error('[MicNative] encode error:', e);
    }
  };

  private _connectWS(url: string) {
    this.onStateChange?.(MicState.CONNECTING);
    let wsUrl = url;
    if (Platform.OS === 'ios') {
      wsUrl = url.includes('?') ? url + '&type=ios' : url + '?type=ios';
    }

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      if (this._destroyed) return;
      try {
        getLiveAudioStream().start();
        this._audioStarted = true;
        this._packetsSent = 0;
        this._bytesSent = 0;
        console.log('[MicNative] WS open, audio started');
        this.onStateChange?.(MicState.STREAMING);
      } catch (e) {
        console.error('[MicNative] start capture failed:', e);
        this.onError?.('Failed to start microphone');
      }
    };

    ws.onclose = (ev) => {
      console.log('[MicNative] WS closed:', ev?.code, ev?.reason);
      if (this._audioStarted) {
        try {
          getLiveAudioStream().stop();
        } catch {
          /* */
        }
        this._audioStarted = false;
      }
    };

    ws.onerror = (e: any) => {
      console.error('[MicNative] WS error:', e?.message ?? e);
      this.onError?.('Backchannel connection error');
    };

    ws.onmessage = (ev: any) => {
      if (typeof ev.data === 'string') {
        console.log('[MicNative] WS recv:', ev.data.substring(0, 200));
      }
    };

    this.ws = ws;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useMic({ micUrl, autoStart = false, webViewRef }: UseMicConfig = {}): UseMicResult {
  const dispatch = useAppDispatch();
  const micState = useAppSelector((s) => s.stream.micState);
  const isMounted = useRef(true);
  const micUrlRef = useRef(micUrl);
  const nativeMicRef = useRef<NativeMic | null>(null);
  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    micUrlRef.current = micUrl;
  }, [micUrl]);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeDispatch = useCallback(
    (action: any) => {
      if (isMounted.current) dispatch(action);
    },
    [dispatch]
  );

  // ── Android: handle messages from WebView ──
  const handleMicMessage = useCallback(
    (data: any) => {
      if (data?.type !== '__mic_state') return;
      switch (data.state) {
        case 'connecting':
          safeDispatch(setMicState(MicState.CONNECTING));
          break;
        case 'streaming':
          console.log('[MicWV] Streaming started');
          safeDispatch(setMicState(MicState.STREAMING));
          break;
        case 'stopped':
          safeDispatch(setMicState(MicState.STOPPED));
          break;
        case 'error':
          console.error('[MicWV] Error:', data.error);
          safeDispatch(setError(`Mic: ${data.error}`));
          safeDispatch(setMicState(MicState.STOPPED));
          break;
        case 'info':
          console.log('[MicWV]', data.msg);
          break;
        case 'ws_message':
          console.log('[MicWV] Server:', data.message);
          break;
      }
    },
    [safeDispatch]
  );

  // ── Start ──
  const startMic = useCallback(async () => {
    const url = micUrlRef.current;
    if (!url || !isStreamURLValid(url)) {
      safeDispatch(setError('Invalid Mic token'));
      return;
    }

    if (isAndroid) {
      // Android: WebView MediaRecorder (webm/opus)
      if (!webViewRef?.current) {
        safeDispatch(setError('WebView not ready'));
        return;
      }
      console.log('[MicWV] Starting (Android MediaRecorder webm/opus)');
      webViewRef.current.injectJavaScript(buildStartMicJS(url));
    } else {
      // iOS: Native capture → PCMU → WS
      if (nativeMicRef.current) {
        nativeMicRef.current.destroy();
        nativeMicRef.current = null;
      }
      console.log('[MicNative] Starting (iOS PCMU mode)');
      const mic = new NativeMic();
      mic.onStateChange = (s) => {
        if (isMounted.current) safeDispatch(setMicState(s));
      };
      mic.onError = (e) => {
        if (isMounted.current) safeDispatch(setError(`Mic: ${e}`));
      };
      nativeMicRef.current = mic;
      mic.start(url);
    }
  }, [safeDispatch, webViewRef, isAndroid]);

  // ── Stop ──
  const stopMic = useCallback(() => {
    if (isAndroid) {
      if (webViewRef?.current) {
        webViewRef.current.injectJavaScript(buildStopMicJS());
      }
    } else {
      if (nativeMicRef.current) {
        nativeMicRef.current.destroy();
        nativeMicRef.current = null;
      }
    }
    safeDispatch(setMicState(MicState.STOPPED));
  }, [safeDispatch, webViewRef, isAndroid]);

  // ── Toggle ──
  const toggleMic = useCallback(async () => {
    micState === MicState.STREAMING || micState === MicState.CONNECTING
      ? stopMic()
      : await startMic();
  }, [micState, startMic, stopMic]);

  // Auto-start
  useEffect(() => {
    if (autoStart && micUrl && isStreamURLValid(micUrl)) {
      startMic();
    }
    return () => {
      if (isAndroid && webViewRef?.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        webViewRef.current.injectJavaScript(buildStopMicJS());
      }
      if (!isAndroid && nativeMicRef.current) {
        nativeMicRef.current.destroy();
        nativeMicRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micUrl, autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isAndroid && webViewRef?.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        webViewRef.current.injectJavaScript(buildStopMicJS());
      }
      if (!isAndroid && nativeMicRef.current) {
        nativeMicRef.current.destroy();
        nativeMicRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { micState, startMic, stopMic, toggleMic, handleMicMessage };
}
