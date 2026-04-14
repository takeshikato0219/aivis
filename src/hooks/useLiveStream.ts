import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

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

export interface UseLiveStreamReturn {
  webViewRef: RefObject<WebView | null>;
  isLoading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'failed';
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

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>(
    'connecting'
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [streamProtocol, setStreamProtocol] = useState<StreamProtocol>(null);

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
      if (timeSinceLastHeartbeat > heartbeatTimeout) {
        console.warn('Heartbeat timeout detected, connection may be lost');
        handleConnectionLostRef.current();
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, heartbeatTimeout, isNativeHls]);

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

    // Calculate delay with exponential backoff (max retryMaxDelay)
    const delay = Math.min(retryBaseDelay * Math.pow(2, currentRetryCount), retryMaxDelay);
    console.log(`Scheduling retry in ${delay}ms`);

    // Schedule retry
    retryTimerRef.current = setTimeout(() => {
      // Clear the timer ref so future handleConnectionLost calls can work
      retryTimerRef.current = null;

      const newRetryCount = retryCountRef.current + 1;
      console.log(`Executing retry ${newRetryCount}/${maxRetries}`);

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

    setConnectionStatus('connecting');
    setIsLoading(true);
    setStreamProtocol(null);
    setIsReconnecting(false);

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

    retryCountRef.current = 0;
    setRetryCount(0);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setIsReconnecting(false);
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
          if (connectionStatus !== 'failed') {
            setConnectionStatus('connected');
            setIsLoading(false);
            setIsReconnecting(false);
          }
          return;
        }

        if (data.type === 'playing' || data.type === 'connected') {
          lastHeartbeatRef.current = Date.now();
          hasEverConnectedRef.current = true;
          setIsLoading(false);
          setConnectionStatus('connected');
          setIsReconnecting(false);
          retryCountRef.current = 0;
          setRetryCount(0);
          return;
        }

        // JS is alive and actively trying to connect — reset heartbeat to prevent timeout
        if (data.type === 'jsReady' || data.type === 'buffering') {
          lastHeartbeatRef.current = Date.now();
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
          setStreamProtocol(data.protocol);
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
    let wasConnected = true;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;

      if (isConnected && !wasConnected) {
        console.log('Network restored, attempting auto-retry');
        retryCountRef.current = 0;
        setRetryCount(0);
        setIsLoading(true);
        setConnectionStatus('connecting');
        setIsReconnecting(false);
        setTimeout(() => {
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
      if (!isConnected && wasConnected && connectionStatus === 'connected') {
        console.warn('Network lost detected');
        handleConnectionLostRef.current();
      }

      wasConnected = !!isConnected;
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
    retryCountRef.current = 0;
    setRetryCount(0);
    setStreamProtocol('hls');
  }, [isNativeHls]);

  const markNativePlaybackFailed = useCallback(() => {
    if (!isNativeHls) {
      return;
    }
    setIsLoading(false);
    setConnectionStatus('failed');
  }, [isNativeHls]);

  return {
    webViewRef,
    isLoading,
    connectionStatus,
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
