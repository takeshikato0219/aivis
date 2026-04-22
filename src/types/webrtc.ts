import { decodeStreamTokenFromUrlValue, getRawTokenValueFromUrl } from '../utils/streamUtils';
import { MicState as _MicState } from '../redux/slices/streamSlice';
export { StreamStatus, MicState, type TokenInfo } from '../redux/slices/streamSlice';

// Lazy-loaded to avoid NativeEventEmitter crash at module load time
let _LiveAudioStream: any = null;
function getLiveAudioStream() {
  if (!_LiveAudioStream) {
    _LiveAudioStream = require('react-native-live-audio-stream').default;
  }
  return _LiveAudioStream;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface TokenPayload {
  camera_id: string;
  start_time: string;
  time_exp: string;
  exp: number;
}

// ─── Token Utils ──────────────────────────────────────────────────────────────

function extractToken(url: string): string | null {
  const raw = getRawTokenValueFromUrl(url);
  if (raw == null || raw === '') return null;
  return decodeStreamTokenFromUrlValue(raw);
}
function decodeToken(token: string) {
  try {
    const p = JSON.parse(atob(token));
    return p?.payload && p?.signature ? p : null;
  } catch {
    return null;
  }
}
export function isStreamURLValid(url: string): boolean {
  const t = extractToken(url);
  if (!t) return false;
  const d = decodeToken(t);
  if (!d?.payload?.time_exp) return false;
  return Date.now() < new Date(d.payload.time_exp).getTime();
}
export function getStreamExpiry(url: string) {
  const payload = decodeToken(extractToken(url) ?? '')?.payload as TokenPayload | undefined;
  if (!payload)
    return { startTime: null, expTime: null, expMinutes: 0, isValid: false, remainingMs: 0 };
  const expTime = new Date(payload.time_exp);
  const remainingMs = Math.max(0, expTime.getTime() - Date.now());
  return {
    startTime: payload.start_time ? new Date(payload.start_time) : null,
    expTime,
    expMinutes: payload.exp ?? 0,
    isValid: remainingMs > 0,
    remainingMs,
  };
}

// ─── Base64 → ArrayBuffer helper ─────────────────────────────────────────────

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

// ─── ArrayBuffer → Base64 helper (for sendBinary) ────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── PCM 16-bit LE → G.711 μ-law (PCMU) encoder ─────────────────────────────

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

// ─── MicRTC (Raw Audio over WebSocket) ───────────────────────────────────────
//
// The /backchannel endpoint expects G.711 μ-law (PCMU) binary frames over WS.
// We capture PCM from the microphone using react-native-live-audio-stream,
// encode it to PCMU 8kHz mono, and send binary WS frames.
//

/** Audio config for backchannel: PCMU 8kHz mono */
const MIC_SAMPLE_RATE = 8000;
const MIC_CHANNELS = 1;
const MIC_BITS = 16;

export class MicRTC {
  onStateChange: ((s: _MicState) => void) | null = null;
  onError: ((e: string) => void) | null = null;

  private _destroyed = false;
  private ws: WebSocket | null = null;
  private micURL = '';
  private state: _MicState = _MicState.IDLE;
  private reconnectTID: ReturnType<typeof setTimeout> | null = null;
  private connectTS = 0;
  private _audioStarted = false;
  private _packetsSent = 0;
  private _bytesSent = 0;
  private _lastLogTS = 0;

  async start(url: string, _streamWsUrl?: string) {
    this.micURL = url;
    console.log('[MicRTC] start() — backchannel PCMU mode');
    console.log('[MicRTC] Target URL:', url.substring(0, 100));

    try {
      // Init live audio capture: PCM 16-bit LE, 8kHz, mono
      getLiveAudioStream().init({
        sampleRate: MIC_SAMPLE_RATE,
        channels: MIC_CHANNELS,
        bitsPerSample: MIC_BITS,
        audioSource: 6, // VOICE_RECOGNITION (Android) — good for speech
        wavFile: '', // no file recording needed
        bufferSize: 4096,
      });
      console.log('[MicRTC] LiveAudioStream initialized (PCM 8kHz/16bit/mono)');

      // Register audio data callback
      getLiveAudioStream().on('data', this._onAudioData);

      // Connect WebSocket first, then start audio capture
      this._connectWS();
    } catch (e) {
      console.error('[MicRTC] Init failed:', e);
      this._setState(_MicState.ERROR);
      this.onError?.('Failed to initialize microphone');
    }
  }

  destroy() {
    console.log(
      '[MicRTC] destroy() — packetsSent:',
      this._packetsSent,
      'bytesSent:',
      this._bytesSent
    );
    this._destroyed = true;
    if (this.reconnectTID) {
      clearTimeout(this.reconnectTID);
      this.reconnectTID = null;
    }
    // Stop audio capture
    if (this._audioStarted) {
      try {
        getLiveAudioStream().stop();
      } catch {
        /* ignore */
      }
      this._audioStarted = false;
    }
    // Close WebSocket
    if (this.ws) {
      this.ws.onopen = this.ws.onclose = this.ws.onmessage = this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.onStateChange = null;
    this.onError = null;
  }

  /** Audio data callback — receives base64-encoded PCM data */
  private _onAudioData = (base64Data: string) => {
    if (this._destroyed) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      // Decode base64 → PCM 16-bit LE
      const pcmBuf = base64ToArrayBuffer(base64Data);

      // Encode PCM → G.711 μ-law (PCMU)
      const mulawBuf = pcm16ToMulaw(pcmBuf);

      // Convert PCMU ArrayBuffer → base64 string for sendBinary
      const mulawB64 = arrayBufferToBase64(mulawBuf);

      // Use ws.send() — RN internally calls sendBinary for ArrayBuffer
      this.ws.send(mulawBuf);
      this._packetsSent++;
      this._bytesSent += mulawBuf.byteLength;

      // Log: first 5 packets, then every 5 seconds
      const now = Date.now();
      if (this._packetsSent <= 5) {
        console.log(
          `[MicRTC] Packet #${this._packetsSent}: ` +
            `PCMU ${mulawBuf.byteLength}B from PCM ${pcmBuf.byteLength}B ` +
            `(${pcmBuf.byteLength / 2} samples) mulawB64=${mulawB64.length}chars`
        );
      } else if (now - this._lastLogTS > 5000) {
        this._lastLogTS = now;
        console.log(
          `[MicRTC] Audio flowing: packets=${this._packetsSent} ` +
            `bytes=${this._bytesSent} wsState=${this.ws.readyState}`
        );
      }
    } catch (e) {
      console.error('[MicRTC] Audio error at packet', this._packetsSent, ':', e);
    }
  };

  private _connectWS() {
    if (this._destroyed) return;
    this.connectTS = Date.now();
    this._setState(_MicState.CONNECTING);

    console.log('[MicRTC] Connecting WS:', this.micURL.substring(0, 100) + '...');
    const ws = new WebSocket(this.micURL);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log('[MicRTC] WS opened — starting audio capture');
      console.log('[MicRTC] WS readyState:', ws.readyState, 'binaryType:', ws.binaryType);
      if (this._destroyed) return;

      try {
        getLiveAudioStream().start();
        this._audioStarted = true;
        this._packetsSent = 0;
        this._bytesSent = 0;
        console.log('[MicRTC] Audio capture started');
        this._setState(_MicState.STREAMING);
      } catch (e) {
        console.error('[MicRTC] Failed to start audio capture:', e);
        this._setState(_MicState.ERROR);
        this.onError?.('Failed to start microphone');
      }
    };

    ws.onclose = (ev) => {
      console.log('[MicRTC] WS closed, code:', ev?.code, 'reason:', ev?.reason);
      if (this._destroyed) return;

      if (this._audioStarted) {
        try {
          getLiveAudioStream().stop();
        } catch {
          /* ignore */
        }
        this._audioStarted = false;
      }

      this._setState(_MicState.ERROR);
      const delay = Math.max(5000 - (Date.now() - this.connectTS), 0);
      this.reconnectTID = setTimeout(() => {
        this.reconnectTID = null;
        if (!this._destroyed) this._connectWS();
      }, delay);
    };

    ws.onerror = (e: any) => {
      console.error('[MicRTC] WS error:', e?.message ?? e?.type ?? e);
      if (!this._destroyed) {
        this.onError?.('Backchannel connection error');
      }
    };

    ws.onmessage = (ev: any) => {
      if (typeof ev.data === 'string') {
        console.log('[MicRTC] WS recv text:', ev.data.substring(0, 200));
      } else {
        console.log('[MicRTC] WS recv binary:', ev.data?.byteLength ?? '?', 'bytes');
      }
    };

    this.ws = ws;
  }

  private _setState(s: _MicState) {
    this.state = s;
    if (!this._destroyed) this.onStateChange?.(s);
  }
}
