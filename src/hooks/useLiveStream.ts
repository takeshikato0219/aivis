import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import { streamDebugLog } from '@utils/streamDebugLog';

export interface UseLiveStreamConfig {
  maxRetries?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  retryBaseDelay?: number;
  retryMaxDelay?: number;
  initialLoadingMin?: number;
  initialLoadingMax?: number;
  initialGracePeriod?: number;
  playbackSurface?: 'webview' | 'native-hls';
  onReloadNativePlayer?: () => void;
}

export type StreamProtocol = 'mse' | 'hls' | 'mjpeg' | null;

export type PlayerLoadPhase = 'connecting' | 'buffering' | 'connected';

export interface UseLiveStreamReturn {
  webViewRef: RefObject<WebView | null>;
  isLoading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'failed';
  playerLoadPhase: PlayerLoadPhase;
  isReconnecting: boolean;
  retryCount: number;
  streamProtocol: StreamProtocol;
  handleWebViewLoad: () => void;
  handleWebViewError: () => void;
  handleWebViewHttpError: (syntheticEvent: any) => void;
  handleManualRetry: () => void;
  handleWebViewMessage: (event: any) => void;
  cleanup: () => void;
  markNativePlaybackConnected: () => void;
  markNativePlaybackFailed: () => void;
}

const DEFAULT_CONFIG: Required<Omit<UseLiveStreamConfig, 'onReloadNativePlayer'>> & {
  onReloadNativePlayer?: () => void;
} = {
  maxRetries: 5,
  heartbeatInterval: 10000,
  heartbeatTimeout: 45000,
  retryBaseDelay: 2000,
  retryMaxDelay: 30000,
  initialLoadingMin: 3000,
  initialLoadingMax: 40000,
  initialGracePeriod: 8000,
  playbackSurface: 'webview',
  onReloadNativePlayer: undefined,
};

export const useLiveStream = (config: UseLiveStreamConfig = {}): UseLiveStreamReturn => {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const {
    maxRetries,
    heartbeatInterval,
    heartbeatTimeout,
    retryBaseDelay,
    retryMaxDelay,
    initialLoadingMax,
    initialGracePeriod,
    playbackSurface,
    onReloadNativePlayer,
  } = merged;
  const isNativeHls = playbackSurface === 'native-hls';

  const webViewRef = useRef<WebView>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  const hasEverConnectedRef = useRef<boolean>(false);
  const handleConnectionLostRef = useRef<() => void>(() => {});
  const heartbeatTimeoutRef = useRef(heartbeatTimeout);
  const connectionStatusRef = useRef<'connecting' | 'connected' | 'failed'>('connecting');
  const playerScriptSignaledRef = useRef(false);
  const lastBufferingSignalDebugAtRef = useRef(0);

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>(
    'connecting'
  );
  const [playerLoadPhase, setPlayerLoadPhase] = useState<PlayerLoadPhase>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [streamProtocol, setStreamProtocol] = useState<StreamProtocol>(null);

  useEffect(() => {
    heartbeatTimeoutRef.current = heartbeatTimeout;
  }, [heartbeatTimeout]);

  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // Keep retryCountRef in sync with state
  useEffect(() => {
    retryCountRef.current = retryCount;
  }, [retryCount]);

  const startHeartbeatMonitoring = useCallback(() => {
    if (isNativeHls) {
      return;
    }
    // Clear existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Reset heartbeat time
    lastHeartbeatRef.current = Date.now();

    // Start heartbeat check every interval
    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
      // If no heartbeat for timeout period, consider connection lost
      if (timeSinceLastHeartbeat > heartbeatTimeoutRef.current) {
        console.warn('Heartbeat timeout detected, connection may be lost');
        streamDebugLog('heartbeatTimeout', {
          msSinceHeartbeat: timeSinceLastHeartbeat,
          limitMs: heartbeatTimeoutRef.current,
        });
        handleConnectionLostRef.current();
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, isNativeHls]);

  const handleConnectionLost = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (retryTimerRef.current) {
      console.log('Retry already scheduled, skipping duplicate handleConnectionLost call');
      return;
    }

    // Clear heartbeat monitoring
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Always set loading to false so overlays can show
    setIsLoading(false);

    const currentRetryCount = retryCountRef.current;
    console.log(`Connection lost. Current retry count: ${currentRetryCount}/${maxRetries}`);

    // Don't retry if max retries reached
    if (currentRetryCount >= maxRetries) {
      console.warn('Max retries reached, showing failed state');
      setConnectionStatus('failed');
      setIsReconnecting(false);
      return;
    }

    // Set reconnecting state immediately so UI shows reconnecting overlay
    setIsReconnecting(true);
    setConnectionStatus('connecting');
    setPlayerLoadPhase('connecting');

    // Calculate delay with exponential backoff (max retryMaxDelay)
    const delay = Math.min(retryBaseDelay * Math.pow(2, currentRetryCount), retryMaxDelay);
    console.log(`Scheduling retry in ${delay}ms`);

    // Schedule retry
    retryTimerRef.current = setTimeout(() => {
      // Clear the timer ref so future handleConnectionLost calls can work
      retryTimerRef.current = null;

      const newRetryCount = retryCountRef.current + 1;
      console.log(`Executing retry ${newRetryCount}/${maxRetries}`);
      streamDebugLog('streamRetry', { attempt: newRetryCount, maxRetries });

      // Update both ref and state
      retryCountRef.current = newRetryCount;
      setRetryCount(newRetryCount);

      // Check if max retries reached after incrementing
      if (newRetryCount >= maxRetries) {
        console.warn('Max retries reached after increment, showing failed state');
        setConnectionStatus('failed');
        setIsReconnecting(false);
        return;
      }

      // Reload and reset heartbeat
      lastHeartbeatRef.current = Date.now();
      playerScriptSignaledRef.current = false;
      lastBufferingSignalDebugAtRef.current = 0;
      if (isNativeHls) {
        onReloadNativePlayer?.();
      } else {
        webViewRef.current?.reload();
      }

      // Start monitoring again after reload
      setTimeout(() => {
        if (!isNativeHls && webViewRef.current) {
          startHeartbeatMonitoring();
        }
      }, 1000);
    }, delay);
  }, [
    maxRetries,
    retryBaseDelay,
    retryMaxDelay,
    startHeartbeatMonitoring,
    isNativeHls,
    onReloadNativePlayer,
  ]);

  // Keep ref updated with latest callback
  useEffect(() => {
    handleConnectionLostRef.current = handleConnectionLost;
  }, [handleConnectionLost]);

  const handleWebViewLoad = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }

    if (playerScriptSignaledRef.current) {
      streamDebugLog('webViewLoadSoft');
      lastHeartbeatRef.current = Date.now();
      graceTimerRef.current = setTimeout(
        () => {
          graceTimerRef.current = null;
          startHeartbeatMonitoring();
        },
        hasEverConnectedRef.current ? 2000 : initialGracePeriod
      );
      return;
    }

    setConnectionStatus('connecting');
    setIsLoading(true);
    setStreamProtocol(null);
    setIsReconnecting(false);
    setPlayerLoadPhase('connecting');
    lastBufferingSignalDebugAtRef.current = 0;
    streamDebugLog('webViewLoad');

    lastHeartbeatRef.current = Date.now();

    // Delay heartbeat monitoring to give JS time to establish MSE/HLS connection.
    // During grace period, jsReady/buffering messages from JS will keep resetting
    // the heartbeat timestamp, preventing premature timeout.
    graceTimerRef.current = setTimeout(
      () => {
        graceTimerRef.current = null;
        startHeartbeatMonitoring();
      },
      hasEverConnectedRef.current ? 2000 : initialGracePeriod
    );
  }, [startHeartbeatMonitoring, initialGracePeriod]);

  const handleWebViewError = useCallback(() => {
    streamDebugLog('webViewError');
    setIsLoading(false);
    setConnectionStatus('failed');
    handleConnectionLost();
  }, [handleConnectionLost]);

  const handleWebViewHttpError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.warn('WebView HTTP error:', nativeEvent);
      handleConnectionLost();
    },
    [handleConnectionLost]
  );

  const handleManualRetry = useCallback(() => {
    console.log('Manual retry triggered');

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }

    playerScriptSignaledRef.current = false;
    lastBufferingSignalDebugAtRef.current = 0;
    retryCountRef.current = 0;
    setRetryCount(0);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setIsReconnecting(false);
    setPlayerLoadPhase('connecting');
    lastHeartbeatRef.current = Date.now();
    if (isNativeHls) {
      onReloadNativePlayer?.();
    } else {
      webViewRef.current?.reload();
    }

    graceTimerRef.current = setTimeout(() => {
      graceTimerRef.current = null;
      startHeartbeatMonitoring();
    }, initialGracePeriod);
  }, [startHeartbeatMonitoring, initialGracePeriod, isNativeHls, onReloadNativePlayer]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'heartbeat') {
          lastHeartbeatRef.current = Date.now();
          playerScriptSignaledRef.current = true;
          if (connectionStatus !== 'failed') {
            setConnectionStatus('connected');
            setIsLoading(false);
            setIsReconnecting(false);
            setPlayerLoadPhase('connected');
          }
          return;
        }

        if (data.type === 'playing' || data.type === 'connected') {
          lastHeartbeatRef.current = Date.now();
          playerScriptSignaledRef.current = true;
          hasEverConnectedRef.current = true;
          setIsLoading(false);
          setConnectionStatus('connected');
          setIsReconnecting(false);
          setPlayerLoadPhase('connected');
          retryCountRef.current = 0;
          setRetryCount(0);
          streamDebugLog('playerPlaying', { via: data.type });
          return;
        }

        // JS is alive and actively trying to connect — reset heartbeat to prevent timeout
        if (data.type === 'jsReady' || data.type === 'buffering') {
          lastHeartbeatRef.current = Date.now();
          playerScriptSignaledRef.current = true;
          if (connectionStatusRef.current !== 'connected') {
            setPlayerLoadPhase('buffering');
          }
          if (__DEV__) {
            const now = Date.now();
            const minGapMs = 18000;
            if (now - lastBufferingSignalDebugAtRef.current >= minGapMs) {
              lastBufferingSignalDebugAtRef.current = now;
              streamDebugLog('playerBufferingSignal', { type: data.type });
            }
          }
          return;
        }

        if (data.type === 'failed' || data.type === 'wsClose' || data.type === 'wsError') {
          setIsLoading(false);
          handleConnectionLost();
          return;
        }

        if (data.type === 'error') {
          console.warn('Player error:', data.message, data.detail);
          setIsLoading(false);
          handleConnectionLost();
          return;
        }

        if (data.type === 'stalled') {
          // Only trigger reconnection if we had a working connection before.
          // During initial connection the video may stall briefly while buffering.
          if (hasEverConnectedRef.current) {
            setIsLoading(false);
            handleConnectionLost();
          }
          return;
        }

        if (data.type === 'protocol' && data.protocol) {
          lastHeartbeatRef.current = Date.now();
          playerScriptSignaledRef.current = true;
          setStreamProtocol(data.protocol);
          streamDebugLog('streamProtocol', { protocol: data.protocol });
          return;
        }
      } catch {
        // ignore
      }
    },
    [handleConnectionLost, connectionStatus]
  );

  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  // Initial loading timeout — fires once per mount. If no connection after
  // initialLoadingMax, trigger connection lost to begin retry cycle.
  useEffect(() => {
    if (isNativeHls) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setIsLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('Initial loading timeout - no connection established');
          streamDebugLog('initialLoadingTimeout', { initialLoadingMax });
          handleConnectionLostRef.current();
          return false;
        }
        return prevLoading;
      });
    }, initialLoadingMax);

    return () => clearTimeout(timer);
  }, [initialLoadingMax, isNativeHls]);

  // Network status monitoring - auto-retry when network is restored
  useEffect(() => {
    const netReachableOk = (state: {
      isConnected: boolean | null;
      isInternetReachable: boolean | null;
    }) => {
      if (!state.isConnected) {
        return false;
      }
      const r = state.isInternetReachable;
      // Cellular often reports null until a probe completes; treat as reachable to avoid false negatives.
      return r === null || r === true;
    };

    let wasNetOk = true;

    NetInfo.fetch?.()?.then?.((state) => {
      wasNetOk = netReachableOk(state);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = netReachableOk(state);

      if (isConnected && !wasNetOk) {
        console.log('Network restored, attempting auto-retry');
        streamDebugLog('netRestored');
        retryCountRef.current = 0;
        setRetryCount(0);
        setIsLoading(true);
        setConnectionStatus('connecting');
        setIsReconnecting(false);
        setPlayerLoadPhase('connecting');
        setTimeout(() => {
          playerScriptSignaledRef.current = false;
          lastBufferingSignalDebugAtRef.current = 0;
          if (isNativeHls) {
            onReloadNativePlayer?.();
          } else {
            webViewRef.current?.reload();
          }
          lastHeartbeatRef.current = Date.now();
          if (graceTimerRef.current) {
            clearTimeout(graceTimerRef.current);
          }
          graceTimerRef.current = setTimeout(() => {
            graceTimerRef.current = null;
            startHeartbeatMonitoring();
          }, initialGracePeriod);
        }, 500);
      }

      // Network lost - trigger connection lost
      if (!isConnected && wasNetOk && connectionStatus === 'connected') {
        console.warn('Network lost detected');
        streamDebugLog('netLost');
        handleConnectionLostRef.current();
      }

      wasNetOk = isConnected;
    });

    return () => {
      unsubscribe();
    };
  }, [
    connectionStatus,
    startHeartbeatMonitoring,
    initialGracePeriod,
    isNativeHls,
    onReloadNativePlayer,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const markNativePlaybackConnected = useCallback(() => {
    if (!isNativeHls) {
      return;
    }
    lastHeartbeatRef.current = Date.now();
    hasEverConnectedRef.current = true;
    setIsLoading(false);
    setConnectionStatus('connected');
    setIsReconnecting(false);
    setPlayerLoadPhase('connected');
    retryCountRef.current = 0;
    setRetryCount(0);
    setStreamProtocol('hls');
    streamDebugLog('nativeHlsOnLoad');
  }, [isNativeHls]);

  const markNativePlaybackFailed = useCallback(() => {
    if (!isNativeHls) {
      return;
    }
    setIsLoading(false);
    setConnectionStatus('failed');
    setPlayerLoadPhase('connecting');
    streamDebugLog('nativeHlsError');
  }, [isNativeHls]);

  return {
    webViewRef,
    isLoading,
    connectionStatus,
    playerLoadPhase,
    isReconnecting,
    retryCount,
    streamProtocol,
    handleWebViewLoad,
    handleWebViewError,
    handleWebViewHttpError,
    handleManualRetry,
    handleWebViewMessage,
    cleanup,
    markNativePlaybackConnected,
    markNativePlaybackFailed,
  };
};
