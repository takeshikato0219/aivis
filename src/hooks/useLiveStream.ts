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

        if (data.type === 'heartbeat') {
          // Update last heartbeat time
          lastHeartbeatRef.current = Date.now();
          // If still loading, mark as connected after receiving heartbeat
          setIsLoading((prev) => {
            if (prev) {
              setConnectionStatus('connected');
              setIsReconnecting(false);
              retryCountRef.current = 0;
              setRetryCount(0);
              return false;
            }
            return prev;
          });
        } else if (data.type === 'streamReady' || data.type === 'playing') {
          // Stream is confirmed playing
          setIsLoading(false);
          setConnectionStatus('connected');
          setIsReconnecting(false);
          retryCountRef.current = 0;
          setRetryCount(0);
          lastHeartbeatRef.current = Date.now();
        } else if (data.type === 'streamError') {
          // Stream error - trigger retry
          console.warn('Stream error detected');
          setIsLoading(false);
          handleConnectionLost();
        } else if (data.type === 'connection-lost') {
          console.warn('Connection lost detected from WebView');
          setIsLoading(false);
          handleConnectionLost();
        } else if (data.type === 'connection-restored') {
          console.log('Connection restored');
          setIsLoading(false);
          setIsReconnecting(false);
          retryCountRef.current = 0;
          setRetryCount(0);
          setConnectionStatus('connected');
          lastHeartbeatRef.current = Date.now();
        } else if (data.type === 'error') {
          console.warn('WebView error:', data.message);
          // Check if it's a connection-related error
          if (
            data.message &&
            (data.message.includes('network') ||
              data.message.includes('connection') ||
              data.message.includes('failed') ||
              data.message.includes('timeout'))
          ) {
            setIsLoading(false);
            handleConnectionLost();
          }
        }
      } catch (error) {
        console.log('WebView message:', error);
      }
    },
    [handleConnectionLost]
  );

  const getInjectedJavaScript = useCallback((): string => {
    return `
      (function() {
        // Log errors to React Native
        window.onerror = function(msg, url, line, col, error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: msg,
            url: url,
            line: line
          }));
          return false;
        };
        
        // Override console for debugging
        const originalLog = console.log;
        console.log = function(msg) {
          originalLog(msg);
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'log',
              message: String(msg)
            }));
          } catch(e) {}
        };
        
        // Heartbeat monitoring
        let heartbeatInterval = null;
        let lastHeartbeatTime = Date.now();
        let streamConfirmed = false;
        
        function sendHeartbeat() {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'heartbeat',
              timestamp: Date.now()
            }));
            lastHeartbeatTime = Date.now();
          } catch(e) {
            console.error('Failed to send heartbeat:', e);
          }
        }
        
        // Monitor video elements for stream status
        function monitorVideoElements() {
          const videos = document.querySelectorAll('video');
          videos.forEach(function(video) {
            video.addEventListener('playing', function() {
              if (!streamConfirmed) {
                streamConfirmed = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playing' }));
              }
            });
            video.addEventListener('error', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'streamError' }));
            });
            video.addEventListener('stalled', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stalled' }));
            });
            
            // Check if video is already playing
            if (!video.paused && video.readyState >= 2) {
              if (!streamConfirmed) {
                streamConfirmed = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playing' }));
              }
            }
          });
        }
        
        // Monitor iframe connection
        function monitorIframe() {
          const iframe = document.querySelector('iframe');
          if (!iframe) {
            console.warn('Iframe not found');
            // Still send heartbeat to indicate page loaded
            sendHeartbeat();
            return;
          }
          
          // Check if iframe is loaded
          iframe.onload = function() {
            console.log('Iframe loaded successfully');
            sendHeartbeat();
          };
          
          // Monitor iframe errors
          iframe.onerror = function() {
            console.error('Iframe error detected');
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'connection-lost',
                reason: 'iframe-error'
              }));
            } catch(e) {}
          };
          
          // Try to access iframe content to check connection
          try {
            // Check if we can access iframe (may fail due to CORS)
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow) {
              // Iframe is accessible, connection seems OK
              sendHeartbeat();
            }
          } catch(e) {
            // CORS error is expected, but we can still monitor
            console.log('Cannot access iframe content (CORS), but iframe exists');
            sendHeartbeat();
          }
        }
        
        // Start monitoring when page loads
        if (document.readyState === 'complete') {
          monitorIframe();
          monitorVideoElements();
          // Send heartbeat every ${heartbeatInterval}ms
          heartbeatInterval = setInterval(sendHeartbeat, ${heartbeatInterval});
        } else {
          window.addEventListener('load', function() {
            monitorIframe();
            monitorVideoElements();
            heartbeatInterval = setInterval(sendHeartbeat, ${heartbeatInterval});
          });
        }
        
        // Timeout fallback - if no stream confirmed in 15 seconds, report error
        setTimeout(function() {
          if (!streamConfirmed) {
            const videos = document.querySelectorAll('video');
            let anyPlaying = false;
            videos.forEach(function(video) {
              if (!video.paused && video.readyState >= 2) {
                anyPlaying = true;
              }
            });
            
            if (!anyPlaying && videos.length > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'streamError', reason: 'timeout' }));
            }
          }
        }, 15000);
        
        // Monitor network status
        window.addEventListener('online', function() {
          console.log('Network online');
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'connection-restored',
              reason: 'network-online'
            }));
          } catch(e) {}
        });
        
        window.addEventListener('offline', function() {
          console.warn('Network offline');
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'connection-lost',
              reason: 'network-offline'
            }));
          } catch(e) {}
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        });
        
        return true; // Required for injectedJavaScript
      })();
    `;
  }, [heartbeatInterval]);

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
