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
}

export interface UseLiveStreamReturn {
  webViewRef: RefObject<WebView | null>;
  isLoading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'failed';
  isReconnecting: boolean;
  retryCount: number;
  handleWebViewLoad: () => void;
  handleWebViewError: () => void;
  handleWebViewHttpError: (syntheticEvent: any) => void;
  handleManualRetry: () => void;
  handleWebViewMessage: (event: any) => void;
  getInjectedJavaScript: () => string;
  cleanup: () => void;
}

const DEFAULT_CONFIG: Required<UseLiveStreamConfig> = {
  maxRetries: 5,
  heartbeatInterval: 10000,
  heartbeatTimeout: 30000,
  retryBaseDelay: 2000,
  retryMaxDelay: 30000,
  initialLoadingMin: 3000,
  initialLoadingMax: 8000,
};

export const useLiveStream = (config: UseLiveStreamConfig = {}): UseLiveStreamReturn => {
  const {
    maxRetries,
    heartbeatInterval,
    heartbeatTimeout,
    retryBaseDelay,
    retryMaxDelay,
    initialLoadingMin,
    initialLoadingMax,
  } = { ...DEFAULT_CONFIG, ...config };

  const webViewRef = useRef<WebView>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  const handleConnectionLostRef = useRef<() => void>(() => {});

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>(
    'connecting'
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Keep retryCountRef in sync with state
  useEffect(() => {
    retryCountRef.current = retryCount;
  }, [retryCount]);

  const startHeartbeatMonitoring = useCallback(() => {
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
  }, [heartbeatInterval, heartbeatTimeout]);

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
      webViewRef.current?.reload();

      // Start monitoring again after reload
      setTimeout(() => {
        if (webViewRef.current) {
          startHeartbeatMonitoring();
        }
      }, 1000);
    }, delay);
  }, [maxRetries, retryBaseDelay, retryMaxDelay, startHeartbeatMonitoring]);

  // Keep ref updated with latest callback
  useEffect(() => {
    handleConnectionLostRef.current = handleConnectionLost;
  }, [handleConnectionLost]);

  const handleWebViewLoad = useCallback(() => {
    // Clear any pending retry timer on successful load
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    setConnectionStatus('connecting');
    setIsLoading(true);

    // Reset retry count on successful load
    retryCountRef.current = 0;
    setRetryCount(0);

    // Clear reconnecting state
    setIsReconnecting(false);

    lastHeartbeatRef.current = Date.now();
    startHeartbeatMonitoring();

    // Set a timeout to confirm connection after receiving first heartbeat
    // If no heartbeat received within 3 seconds, consider it connected anyway
    setTimeout(() => {
      setIsLoading((prev) => {
        if (prev && connectionStatus !== 'failed') {
          setConnectionStatus('connected');
          return false;
        }
        return prev;
      });
    }, 3000);
  }, [startHeartbeatMonitoring, connectionStatus]);

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

    // Clear any existing timers
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Reset retry count (both ref and state)
    retryCountRef.current = 0;
    setRetryCount(0);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setIsReconnecting(false);
    lastHeartbeatRef.current = Date.now();
    webViewRef.current?.reload();

    // Start heartbeat monitoring after a brief delay
    setTimeout(() => {
      startHeartbeatMonitoring();
    }, 1000);
  }, [startHeartbeatMonitoring]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'playing') {
          setIsLoading(false);
          setConnectionStatus('connected');
          setIsReconnecting(false);
          retryCountRef.current = 0;
          setRetryCount(0);
          return;
        }

        if (data.type === 'stalled') {
          setIsLoading(false);
          handleConnectionLost();
          return;
        }
      } catch {}
    },
    [handleConnectionLost]
  );

  const getInjectedJavaScript = useCallback((): string => {
    return `
  (function () {
    function hideUnwantedElements() {
      var zoomBtns = document.querySelectorAll('[class*="zoom"], .zoom-control, .zoom-in, .zoom-out');
      zoomBtns.forEach(function(btn) { btn.style.display = 'none'; });
      var logoEls = document.querySelectorAll('[class*="logo"], #logo, .player-logo, .stream-logo');
      logoEls.forEach(function(el) { el.style.display = 'none'; });
      var controls = document.querySelectorAll('.controls, .player-controls, .toolbar, .header, .footer, .menu, .settings, .sidebar');
      controls.forEach(function(el) { el.style.display = 'none'; });
      var imgs = document.querySelectorAll('img');
      imgs.forEach(function(img) { img.style.display = 'none'; });
    }
    setInterval(hideUnwantedElements, 1000);

    const send = (type,data={})=>{
      window.ReactNativeWebView.postMessage(JSON.stringify({type,...data}));
    };
    let lastFrame = Date.now();
    let playing = false;
    function waitCanvas(){
      const canvas = document.querySelector("canvas");
      if(!canvas){
        requestAnimationFrame(waitCanvas);
        return;
      }
      const ctx = canvas.getContext("2d");
      function detect(){
        try{
          const p = ctx.getImageData(0,0,1,1).data;
          const hasFrame = p[0]||p[1]||p[2];
          if(hasFrame){
            lastFrame = Date.now();
            if(!playing){
              playing=true;
              send("playing");
            }
          }
          if(Date.now()-lastFrame>4000){
            playing=false;
            send("stalled");
          }
        }catch(e){}
        requestAnimationFrame(detect);
      }
      detect();
    }
    waitCanvas();
  })();
  true;
  `;
  }, []);

  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Initial loading timeout - if no connection after initialLoadingMax, show retry
  useEffect(() => {
    const timer = setTimeout(() => {
      // If still loading after max time, trigger connection lost to show retry
      setIsLoading((prevLoading) => {
        if (prevLoading && connectionStatus === 'connecting') {
          // No heartbeat received, consider it failed
          console.warn('Initial loading timeout - no connection established');
          setConnectionStatus('failed');
          setIsReconnecting(false);
          return false;
        }
        return prevLoading;
      });
    }, initialLoadingMax);

    return () => clearTimeout(timer);
  }, [initialLoadingMin, initialLoadingMax, connectionStatus]);

  // Network status monitoring - auto-retry when network is restored
  useEffect(() => {
    let wasConnected = true;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;

      // Network restored - auto retry if currently failed or reconnecting
      if (isConnected && !wasConnected) {
        console.log('Network restored, attempting auto-retry');
        // Reset retry count (both ref and state) and attempt to reconnect
        retryCountRef.current = 0;
        setRetryCount(0);
        setIsLoading(true);
        setConnectionStatus('connecting');
        setIsReconnecting(false);
        // Small delay to ensure network is stable
        setTimeout(() => {
          webViewRef.current?.reload();
          lastHeartbeatRef.current = Date.now();
          startHeartbeatMonitoring();
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
  }, [connectionStatus, startHeartbeatMonitoring]);

  // Cleanup timers on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    webViewRef,
    isLoading,
    connectionStatus,
    isReconnecting,
    retryCount,
    handleWebViewLoad,
    handleWebViewError,
    handleWebViewHttpError,
    handleManualRetry,
    handleWebViewMessage,
    getInjectedJavaScript,
    cleanup,
  };
};
