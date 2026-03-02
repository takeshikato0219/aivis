import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaStream } from 'react-native-webrtc';
import { MicRTC, VideoRTC, getStreamExpiry, isStreamURLValid } from '../types/webrtc';
import {
  MicState,
  StreamStatus,
  clearStall,
  incrementRetry,
  reset,
  resetRetry,
  setError,
  setMicState,
  setMode,
  setStall,
  setStatus,
  setTokenInfo,
} from '../redux/slices/streamSlice';
import { useAppDispatch, useAppSelector } from '../redux/store';

export interface UseStreamConfig {
  live_url: string;
  mic?: string;
  autoConnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface UseStreamResult {
  displayStream: MediaStream | null;
  remoteStream: MediaStream | null;
  lastGoodStream: MediaStream | null;
  isStalled: boolean;
  stallReason: string;
  reconnectAttempt: number;
  error: string | null;
  status: StreamStatus;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  toggleMic: () => Promise<void>;
}

function fmtMs(ms: number) {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function useStream({
  live_url,
  mic: micURL,
  autoConnect = true,
  maxRetries = 3,
  retryDelay = 3000,
}: UseStreamConfig): UseStreamResult {
  const dispatch = useAppDispatch();
  const micState = useAppSelector((s) => s.stream.micState);
  const isStalled = useAppSelector((s) => s.stream.isStalled);
  const stallReason = useAppSelector((s) => s.stream.stallReason);
  const reconnectAttempt = useAppSelector((s) => s.stream.reconnectAttempt);
  const error = useAppSelector((s) => s.stream.error);
  const status = useAppSelector((s) => s.stream.status);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [lastGoodStream, setLastGoodStream] = useState<MediaStream | null>(null);

  const rtcRef = useRef<VideoRTC | null>(null);
  const micRef = useRef<MicRTC | null>(null);
  const retryTID = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenTID = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCount = useRef(0);
  const isMounted = useRef(true);

  const liveUrlRef = useRef(live_url);
  const maxRetriesRef = useRef(maxRetries);
  const retryDelayRef = useRef(retryDelay);
  const lastGoodStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    liveUrlRef.current = live_url;
  }, [live_url]);
  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);
  useEffect(() => {
    retryDelayRef.current = retryDelay;
  }, [retryDelay]);

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

  // ── Token countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!live_url) return;
    const tick = () => {
      if (!isMounted.current) return;
      const info = getStreamExpiry(live_url);
      safeDispatch(
        setTokenInfo({
          isValid: info.isValid,
          expTime: info.expTime?.toISOString() ?? null,
          startTime: info.startTime?.toISOString() ?? null,
          expMinutes: info.expMinutes,
          remainingMs: info.remainingMs,
          remainingLabel: fmtMs(info.remainingMs),
        })
      );
      if (!info.isValid) {
        disconnectAll();
        safeDispatch(setError('Token đã hết hạn. Vui lòng làm mới URL.'));
        safeDispatch(setStatus(StreamStatus.TOKEN_EXPIRED));
      }
    };
    tick();
    tokenTID.current = setInterval(tick, 1000);
    return () => {
      if (tokenTID.current) {
        clearInterval(tokenTID.current);
        tokenTID.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live_url]);

  // ── Internal cleanup ─────────────────────────────────────────────────────
  const disconnectAll = useCallback(() => {
    if (retryTID.current) {
      clearTimeout(retryTID.current);
      retryTID.current = null;
    }
    if (rtcRef.current) {
      rtcRef.current.destroy();
      rtcRef.current = null;
    }
    setRemoteStream(null);
    // lastGoodStream intentionally NOT cleared
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  // STABLE: deps = [safeDispatch] only — never changes after mount.
  // All dynamic values (url, maxRetries, lastGoodStream) are read via refs.
  const connect = useCallback(() => {
    const url = liveUrlRef.current;
    if (!url) return;

    if (!isStreamURLValid(url)) {
      safeDispatch(setError('Token đã hết hạn hoặc không hợp lệ'));
      safeDispatch(setStatus(StreamStatus.ERROR));
      return;
    }

    if (rtcRef.current) {
      rtcRef.current.destroy();
      rtcRef.current = null;
    }
    if (retryTID.current) {
      clearTimeout(retryTID.current);
      retryTID.current = null;
    }

    safeDispatch(setError(null));
    // Only show CONNECTING spinner before first stream ever arrives
    if (!lastGoodStreamRef.current) {
      safeDispatch(setStatus(StreamStatus.CONNECTING));
    }

    const rtc = new VideoRTC();

    rtc.onConnectionState = (s) => {
      if (!isMounted.current) return;
      if (rtcRef.current?.isSilentReconnecting) return;
      if (s === 2) {
        safeDispatch(setStatus(StreamStatus.CONNECTED));
        safeDispatch(resetRetry());
        retryCount.current = 0;
        safeDispatch(setError(null));
      } else if (s === 1) {
        if (!lastGoodStreamRef.current) {
          safeDispatch(setStatus(StreamStatus.CONNECTING));
        }
      }
    };

    rtc.onModeChange = (m) => safeDispatch(setMode(m));

    rtc.onError = (e) => {
      if (!isMounted.current) return;
      if (rtcRef.current?.isStalled || rtcRef.current?.isSilentReconnecting) return;
      safeDispatch(setError(e));
      safeDispatch(setStatus(StreamStatus.ERROR));
      if (retryCount.current < maxRetriesRef.current) {
        retryCount.current++;
        safeDispatch(incrementRetry());
        retryTID.current = setTimeout(() => {
          retryTID.current = null;
          if (isMounted.current) connect();
        }, retryDelayRef.current);
      }
    };

    rtc.onRemoteStream = (stream) => {
      if (!isMounted.current) return;
      setRemoteStream(stream);
      if (stream) {
        // Update both ref (for callbacks) and state (for render)
        lastGoodStreamRef.current = stream;
        setLastGoodStream(stream);
        safeDispatch(clearStall());
        safeDispatch(setStatus(StreamStatus.CONNECTED));
        safeDispatch(setError(null));
      }
    };

    rtc.onStreamStall = (_frozen, reason) => {
      if (!isMounted.current) return;
      safeDispatch(setStall(reason));
      // null remoteStream → displayStream = lastGoodStream → frozen frame, no black screen
      setRemoteStream(null);
    };

    rtc.onStreamRecover = () => {
      if (!isMounted.current) return;
      safeDispatch(clearStall());
    };

    rtcRef.current = rtc;
    rtc.connect(url);
  }, [safeDispatch]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    disconnectAll();
    lastGoodStreamRef.current = null;
    setLastGoodStream(null);
    safeDispatch(reset());
    safeDispatch(setStatus(StreamStatus.DISCONNECTED));
  }, [disconnectAll, safeDispatch]);

  // ── Reconnect ─────────────────────────────────────────────────────────────
  const reconnect = useCallback(() => {
    retryCount.current = 0;
    safeDispatch(resetRetry());
    if (rtcRef.current) {
      rtcRef.current.destroy();
      rtcRef.current = null;
    }
    if (retryTID.current) {
      clearTimeout(retryTID.current);
      retryTID.current = null;
    }
    setRemoteStream(null);
    // NOT clearing lastGoodStream → displayStream stays on last frame
    safeDispatch(reset());
    setTimeout(() => {
      if (isMounted.current) connect();
    }, 300);
  }, [connect, safeDispatch]);

  // ── Mic ───────────────────────────────────────────────────────────────────
  const startMic = useCallback(async () => {
    if (!micURL || !isStreamURLValid(micURL)) {
      safeDispatch(setError('Mic token không hợp lệ'));
      return;
    }
    if (micRef.current) {
      micRef.current.destroy();
      micRef.current = null;
    }
    const mic = new MicRTC();
    mic.onStateChange = (s) => {
      if (isMounted.current) safeDispatch(setMicState(s));
    };
    mic.onError = (e) => {
      if (isMounted.current) safeDispatch(setError(`Mic: ${e}`));
    };
    micRef.current = mic;
    await mic.start(micURL);
  }, [micURL, safeDispatch]);

  const stopMic = useCallback(() => {
    if (micRef.current) {
      micRef.current.destroy();
      micRef.current = null;
    }
    safeDispatch(setMicState(MicState.STOPPED));
  }, [safeDispatch]);

  const toggleMic = useCallback(async () => {
    micState === MicState.STREAMING || micState === MicState.CONNECTING
      ? stopMic()
      : await startMic();
  }, [micState, startMic, stopMic]);

  // ── Auto-connect on live_url change ──────────────────────────────────────
  useEffect(() => {
    if (autoConnect && live_url) connect();
    return () => {
      disconnectAll();
      // Clear on URL change (new camera) — not on reconnect cycles
      lastGoodStreamRef.current = null;
      setLastGoodStream(null);
      if (micRef.current) {
        micRef.current.destroy();
        micRef.current = null;
      }
      safeDispatch(reset());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live_url]);

  // ── Final cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (tokenTID.current) {
        clearInterval(tokenTID.current);
        tokenTID.current = null;
      }
      if (retryTID.current) {
        clearTimeout(retryTID.current);
        retryTID.current = null;
      }
      if (rtcRef.current) {
        rtcRef.current.destroy();
        rtcRef.current = null;
      }
      if (micRef.current) {
        micRef.current.destroy();
        micRef.current = null;
      }
    };
  }, []);

  // remoteStream = live feed from active PC
  // lastGoodStream = last frame ever received, never null after first stream
  // displayStream = whichever is available → user never sees black screen
  const displayStream = remoteStream ?? lastGoodStream;

  return {
    displayStream,
    remoteStream,
    lastGoodStream,
    isStalled,
    stallReason,
    reconnectAttempt,
    error,
    status,
    connect,
    disconnect,
    reconnect,
    startMic,
    stopMic,
    toggleMic,
  };
}
