import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import { MicState as _MicState } from '../redux/slices/streamSlice';
export { StreamStatus, MicState, type TokenInfo } from '../redux/slices/streamSlice';

// ─── Internal Types ───────────────────────────────────────────────────────────

type ConnState = 0 | 1 | 2;
interface WRTCMsg {
  type: string;
  value: string | object;
}
interface TokenPayload {
  camera_id: string;
  start_time: string;
  time_exp: string;
  exp: number;
}

const PC_CONFIG = {
  bundlePolicy: 'max-bundle',
  iceServers: [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }],
};

// ─── Token Utils ──────────────────────────────────────────────────────────────

function extractToken(url: string): string | null {
  try {
    return new URL(
      url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')
    ).searchParams.get('token');
  } catch {
    return null;
  }
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

// ─── VideoRTC ─────────────────────────────────────────────────────────────────

const STALL_MS = 4_000;
const RECON_BASE = 1_500;

export class VideoRTC {
  // ── Public callbacks ──────────────────────────────────────────────────────
  onRemoteStream: ((s: MediaStream | null) => void) | null = null;
  onStreamStall: ((s: MediaStream | null, reason: string) => void) | null = null;
  onStreamRecover: (() => void) | null = null;
  onConnectionState: ((s: ConnState) => void) | null = null;
  onModeChange: ((m: string) => void) | null = null;
  onError: ((e: string) => void) | null = null;

  // ── Private state ─────────────────────────────────────────────────────────
  private _destroyed = false;
  private _stalled = false;
  private _serverClosing = false;
  private _silentReconnecting = false;

  private wsURL = '';
  private wsState: ConnState = 0;
  private pcState: ConnState = 0;
  private mode = '';
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private lastStream: MediaStream | null = null;
  private reconnectTID: ReturnType<typeof setTimeout> | null = null;
  private reconnectN = 0;
  private stallTID: ReturnType<typeof setTimeout> | null = null;
  private onmsg: Record<string, (m: WRTCMsg) => void> = {};

  get isStalled() {
    return this._stalled;
  }
  get lastGoodStream() {
    return this.lastStream;
  }
  get isSilentReconnecting() {
    return this._silentReconnecting;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  connect(url: string) {
    if (this._destroyed) return;
    if (this.ws || this.pc) {
      console.warn('[VideoRTC] already connecting');
      return;
    }
    this.wsURL = url;
    this.wsState = 1;
    this._notify();

    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      if (!this._destroyed) this._wsOpen();
    };
    ws.onclose = () => {
      if (!this._destroyed) this._wsClose();
    };
    ws.onmessage = (ev: any) => {
      if (!this._destroyed) this._wsMsg(ev);
    };
    ws.onerror = () => {
      // Suppress WS errors during silent reconnect
      if (!this._destroyed && !this._silentReconnecting) {
        this.onError?.('WebSocket error');
      }
    };
    this.ws = ws;
  }

  destroy() {
    this._destroyed = true;
    this._clearTimers();
    this._closeWS();
    this._closePC();
    this.onRemoteStream = null;
    this.onStreamStall = null;
    this.onStreamRecover = null;
    this.onConnectionState = null;
    this.onModeChange = null;
    this.onError = null;
    this.lastStream = null;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _clearTimers() {
    if (this.reconnectTID) {
      clearTimeout(this.reconnectTID);
      this.reconnectTID = null;
    }
    if (this.stallTID) {
      clearTimeout(this.stallTID);
      this.stallTID = null;
    }
  }

  private _closeWS() {
    this.wsState = 0;
    if (this.ws) {
      this.ws.onopen = this.ws.onclose = this.ws.onmessage = this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private _closePC() {
    console.log('[VideoRTC] _closePC called - pcState:', this.pcState, 'hasPC:', !!this.pc);
    this.pcState = 0;
    this.mode = '';
    if (this.pc) {
      const iceState = (this.pc as any).iceConnectionState;
      const connState = (this.pc as any).connectionState;
      console.log('[VideoRTC] closing PC - iceState:', iceState, 'connState:', connState);
      this.pc.close();
      this.pc = null;
    }
  }

  private _notify() {
    if (this._destroyed) return;
    const s: ConnState = this.mode ? 2 : this.pcState !== 0 ? this.pcState : this.wsState;
    this.onConnectionState?.(s);
  }

  private _scheduleReconnect(silent: boolean) {
    if (this._destroyed || !this.wsURL) return;

    if (this.reconnectTID) {
      console.log('[VideoRTC] reconnect already scheduled, skipping');
      return;
    }

    this._silentReconnecting = silent;
    if (!silent) this.reconnectN++;
    const delay = silent ? RECON_BASE : Math.min(RECON_BASE * this.reconnectN, 30_000);

    console.log(`[VideoRTC] reconnect #${this.reconnectN} in ${delay}ms (silent=${silent})`);

    this.reconnectTID = setTimeout(() => {
      this.reconnectTID = null;
      if (this._destroyed) return;
      this._closeWS();
      this._closePC();
      this.connect(this.wsURL!);
    }, delay);
  }

  // ── Stall / recover ───────────────────────────────────────────────────────

  private _armWatchdog(reason: string) {
    if (this._destroyed) return;
    if (this.stallTID) {
      clearTimeout(this.stallTID);
      this.stallTID = null;
    }
    this.stallTID = setTimeout(() => {
      this.stallTID = null;
      if (!this._destroyed) this._stall(reason);
    }, STALL_MS);
  }

  private _stall(reason: string) {
    if (this._destroyed || this._stalled) return;
    this._stalled = true;
    this._silentReconnecting = false;
    this._serverClosing = false;
    console.warn('[VideoRTC] stall:', reason);
    this.onStreamStall?.(this.lastStream, reason);
    this.onError?.(`Reconnecting… (${reason})`);
    this._closeWS();
    this._closePC();
    this._notify();
    this._scheduleReconnect(false);
  }

  private _recover() {
    if (this._destroyed || !this._stalled) return;
    this._stalled = false;
    this.reconnectN = 0;
    this.onStreamRecover?.();
  }

  // ── WebSocket events ──────────────────────────────────────────────────────

  private _wsOpen() {
    this.wsState = 2;
    this.onmsg = {};
    this._notify();
    this._setupPC();
  }

  private _wsClose() {
    this.wsState = 0;
    if (this.ws) {
      this.ws.onopen = this.ws.onclose = this.ws.onmessage = this.ws.onerror = null;
    }
    this.ws = null;

    this._serverClosing = true;
    const hadStream = this.lastStream !== null;

    console.log(
      '[VideoRTC] _wsClose, pcState:',
      this.pcState,
      'hadStream:',
      hadStream,
      'stalled:',
      this._stalled,
      'hasTimer:',
      !!this.reconnectTID
    );

    if (this.reconnectTID || this._stalled || this._destroyed) return;

    this._closePC();
    this._scheduleReconnect(hadStream);
  }

  private _wsMsg(ev: MessageEvent) {
    if (typeof ev.data === 'string') {
      try {
        const msg = JSON.parse(ev.data) as WRTCMsg;
        if (msg.type === 'error') this.onError?.(String(msg.value));
        Object.values(this.onmsg).forEach((h) => h(msg));
      } catch {
        /* ignore */
      }
    }
  }

  private _send(v: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(v));
  }

  // ── WebRTC setup ──────────────────────────────────────────────────────────

  private _setupPC() {
    this._serverClosing = false;

    const pc = new RTCPeerConnection(PC_CONFIG as any);
    pc.createDataChannel('keepalive');

    // === ICE Debug Monitoring ===
    pc.addEventListener('iceconnectionstatechange', () => {
      if (this._destroyed) return;
      const iceState = (pc as any).iceConnectionState;
      console.log('[VideoRTC] ⚡ iceConnectionState →', iceState);

      if (iceState === 'checking') {
        console.log('[VideoRTC] ICE checking - finding best route...');
      } else if (iceState === 'connected') {
        console.log('[VideoRTC] ✅ ICE connected - P2P established');
      } else if (iceState === 'completed') {
        console.log('[VideoRTC] ✅ ICE completed');
      } else if (iceState === 'failed') {
        console.error('[VideoRTC] ❌ ICE FAILED - NAT/firewall blocking or no TURN server');
      } else if (iceState === 'disconnected') {
        console.warn('[VideoRTC] ⚠️ ICE disconnected - may recover');
      } else if (iceState === 'closed') {
        console.log('[VideoRTC] ICE closed');
      }
    });

    pc.addEventListener('icegatheringstatechange', () => {
      if (this._destroyed) return;
      const gatherState = (pc as any).iceGatheringState;
      console.log('[VideoRTC] 🔍 iceGatheringState →', gatherState);
    });

    pc.addEventListener('icecandidate', (ev: any) => {
      if (this._destroyed) return;
      if (ev.candidate) {
        const candidateType = ev.candidate.type || 'unknown';
        const protocol = ev.candidate.protocol || 'unknown';
        console.log('[VideoRTC] 📡 ICE candidate type:', candidateType, '| protocol:', protocol);
      } else {
        console.log('[VideoRTC] 📡 ICE gathering complete (null candidate)');
      }
      this._send({ type: 'webrtc/candidate', value: ev.candidate ? ev.candidate.candidate : '' });
    });

    pc.addEventListener('connectionstatechange', () => {
      if (this._destroyed) return;
      const s = (pc as any).connectionState as string;
      const iceState = (pc as any).iceConnectionState;
      console.log('[VideoRTC] pcState →', s, '| iceState:', iceState);

      if (s === 'connected') {
        this.pcState = 2;
        this._serverClosing = false;
        // FIX #5: Reset backoff when genuinely connected (not just on ontrack)
        this.reconnectN = 0;
        this._notify();
      }

      if (s === 'disconnected') {
        // FIX #6: Mark server closing early on disconnected too, before closed fires
        this._serverClosing = true;
        console.log('[VideoRTC] disconnected — marking _serverClosing=true');
      }

      if (s === 'closed') {
        // _serverClosing already true from _wsClose or disconnected state
        this._serverClosing = true;

        // _wsClose() already called _closePC() and _scheduleReconnect()
        // This handler is now just a safety net for cases where PC closes
        // without a prior WS close (e.g. pc.close() called directly)
        if (!this.reconnectTID && !this._stalled) {
          const hadStream = this.lastStream !== null;
          this.pcState = 0;
          this.mode = '';
          console.log('[VideoRTC] connectionstatechange→closed (safety), hadStream:', hadStream);
          this._scheduleReconnect(hadStream);
        } else {
          this.pcState = 0;
          this.mode = '';
        }
      }

      if (s === 'failed') {
        this._serverClosing = false;
        this._clearTimers();
        this.pcState = 0;
        if (this.lastStream) {
          this._stall('WebRTC failed');
        } else {
          this._closePC();
          this._notify();
          this._scheduleReconnect(false);
        }
      }
    });

    pc.addEventListener('track', (ev: any) => {
      if (this._destroyed) return;
      const stream = ev.streams?.[0] as MediaStream | undefined;
      if (!stream) return;

      console.log('[VideoRTC] ontrack → stream ready, tracks:', stream.getTracks().length);

      // FIX #8: Set lastStream immediately — before any async state updates
      // This is the single source of truth for "has stream ever arrived"
      this.lastStream = stream;

      if (this.stallTID) {
        clearTimeout(this.stallTID);
        this.stallTID = null;
      }

      this.pcState = 2;
      this.mode = 'RTC';
      this._notify();
      this.onModeChange?.('RTC');
      this._recover();
      this._silentReconnecting = false;

      this.onRemoteStream?.(stream);

      stream.getVideoTracks().forEach((track) => {
        const t = track as any;
        if (t._rtcInit) return;
        t._rtcInit = true;

        track.addEventListener('mute', () => {
          if (!this._destroyed) {
            console.log('[VideoRTC] 🔇 track.mute - IGNORING (buffering is normal, no watchdog)');
            // Không arm watchdog nữa
          }
        });

        track.addEventListener('unmute', () => {
          if (this._destroyed) return;
          console.log('[VideoRTC] 🔊 track.unmute - stream resumed');
          if (this.stallTID) {
            clearTimeout(this.stallTID);
            this.stallTID = null;
          }
          if (this._stalled) {
            this._recover();
            this.onRemoteStream?.(this.lastStream);
          }
        });

        track.addEventListener('ended', () => {
          if (this._destroyed) return;
          if (this.stallTID) {
            clearTimeout(this.stallTID);
            this.stallTID = null;
          }

          // FIX #9: Check reconnectTID also — if reconnect already scheduled
          // by connectionstatechange, this track.ended is a consequence, not a cause
          if (this._serverClosing || this.reconnectTID || this.pcState === 0) {
            console.log(
              '[VideoRTC] track ended — server close detected, skip stall',
              `(serverClosing=${this._serverClosing}, hasTimer=${!!this.reconnectTID}, pcState=${this.pcState})`
            );
            return;
          }

          console.warn('[VideoRTC] track ended unexpectedly → stall');
          this._stall('Track ended');
        });
      });
    });

    this.onmsg.webrtc = (msg) => {
      if (this._destroyed) return;
      if (msg.type === 'webrtc/candidate') {
        pc.addIceCandidate(
          new RTCIceCandidate({ candidate: msg.value as string, sdpMid: '0' })
        ).catch(console.warn);
      } else if (msg.type === 'webrtc/answer') {
        pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: msg.value as string })
        ).catch(console.warn);
      } else if (
        msg.type === 'error' &&
        typeof msg.value === 'string' &&
        msg.value.includes('webrtc/offer')
      ) {
        this._closePC();
      }
    };

    const kinds: ('video' | 'audio')[] = ['video', 'audio'];
    kinds.forEach((k) => pc.addTransceiver(k, { direction: 'recvonly' }));

    pc.createOffer({})
      .then(async (offer) => {
        if (this._destroyed) return;
        await pc.setLocalDescription(offer as RTCSessionDescription);
        this._send({ type: 'webrtc/offer', value: offer.sdp });
      })
      .catch((e) => {
        if (!this._destroyed) {
          console.error('[VideoRTC] offer failed', e);
          this.onError?.('Failed to create offer');
        }
      });

    this.pcState = 1;
    this.pc = pc;
    this._notify();
  }
}

// ─── MicRTC ───────────────────────────────────────────────────────────────────

export class MicRTC {
  onStateChange: ((s: _MicState) => void) | null = null;
  onError: ((e: string) => void) | null = null;

  private _destroyed = false;
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private micURL = '';
  private state: _MicState = _MicState.IDLE;
  private reconnectTID: ReturnType<typeof setTimeout> | null = null;
  private connectTS = 0;

  async start(url: string) {
    this.micURL = url;
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      this.localStream = stream as unknown as MediaStream;
      this._connectWS();
    } catch {
      this._setState(_MicState.ERROR);
      this.onError?.('Microphone permission denied or unavailable');
    }
  }

  destroy() {
    this._destroyed = true;
    if (this.reconnectTID) {
      clearTimeout(this.reconnectTID);
      this.reconnectTID = null;
    }
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.ws) {
      this.ws.onopen = this.ws.onclose = this.ws.onmessage = this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.onStateChange = null;
    this.onError = null;
  }

  private _connectWS() {
    if (this._destroyed) return;
    this.connectTS = Date.now();
    this._setState(_MicState.CONNECTING);
    const ws = new WebSocket(this.micURL);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      if (!this._destroyed) this._setupPC();
    };
    ws.onclose = () => {
      if (this._destroyed) return;
      const delay = Math.max(5000 - (Date.now() - this.connectTS), 0);
      this.reconnectTID = setTimeout(() => {
        this.reconnectTID = null;
        if (!this._destroyed) this._connectWS();
      }, delay);
    };
    ws.onerror = () => {
      if (!this._destroyed) {
        this.onError?.('Backchannel WS error');
        this._setState(_MicState.ERROR);
      }
    };
    ws.onmessage = (ev: any) => {
      if (this._destroyed || typeof ev.data !== 'string') return;
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'webrtc/candidate')
          this.pc?.addIceCandidate({ candidate: msg.value, sdpMid: '0' }).catch(console.warn);
        if (msg.type === 'webrtc/answer')
          this.pc
            ?.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.value }))
            .catch(console.warn);
      } catch {
        /* ignore */
      }
    };
    this.ws = ws;
  }

  private _setupPC() {
    if (this._destroyed || !this.localStream) return;
    const pc = new RTCPeerConnection(PC_CONFIG as any);

    pc.addEventListener('icecandidate', (ev: any) => {
      if (!this._destroyed)
        this._sendWS({
          type: 'webrtc/candidate',
          value: ev.candidate ? ev.candidate.candidate : '',
        });
    });

    pc.addEventListener('connectionstatechange', () => {
      if (this._destroyed) return;
      const s = (pc as any).connectionState;
      console.log('[MicRTC] connectionState →', s);
      if (s === 'connected') {
        this._setState(_MicState.STREAMING);
        this.ws = null;
      } else if (s === 'failed' || s === 'disconnected') {
        pc.close();
        this.pc = null;
        if (!this._destroyed) {
          this._setState(_MicState.ERROR);
          setTimeout(() => {
            if (!this._destroyed && this.localStream) this._connectWS();
          }, 2000);
        }
      }
    });

    this.localStream.getAudioTracks().forEach((t) => pc.addTrack(t, this.localStream!));

    pc.createOffer({})
      .then(async (offer) => {
        if (this._destroyed) return;
        await pc.setLocalDescription(offer as RTCSessionDescription);
        this._sendWS({ type: 'webrtc/offer', value: offer.sdp });
      })
      .catch(() => {
        if (!this._destroyed) this.onError?.('Failed to create mic offer');
      });

    this.pc = pc;
  }

  private _sendWS(v: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(v));
  }
  private _setState(s: _MicState) {
    this.state = s;
    if (!this._destroyed) this.onStateChange?.(s);
  }
}
