import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { WebView } from 'react-native-webview';

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
  heartbeatInterval: 3000,
  heartbeatTimeout: 10000,
  retryBaseDelay: 2000,
  retryMaxDelay: 30000,
  initialLoadingMin: 5000,
  initialLoadingMax: 10000,
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

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>(
    'connecting'
  );
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleConnectionLost = useCallback(() => {
    // Clear heartbeat monitoring
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Don't retry if already failed or max retries reached
    if (retryCount >= maxRetries) {
      setConnectionStatus('failed');
      setIsReconnecting(false);
      return;
    }

    // Start reconnecting
    setIsReconnecting(true);
    setConnectionStatus('connecting');

    // Calculate delay with exponential backoff (max retryMaxDelay)
    const delay = Math.min(retryBaseDelay * Math.pow(2, retryCount), retryMaxDelay);

    // Clear existing retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    // Schedule retry
    retryTimerRef.current = setTimeout(() => {
      setRetryCount((prev) => prev + 1);
      webViewRef.current?.reload();
    }, delay);
  }, [retryCount, maxRetries, retryBaseDelay, retryMaxDelay]);

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
        handleConnectionLost();
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, heartbeatTimeout, handleConnectionLost]);

  const handleWebViewLoad = useCallback(() => {
    setIsLoading(false);
    setConnectionStatus('connected');
    setIsReconnecting(false);
    setRetryCount(0);
    // Clear any pending retry timers
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    lastHeartbeatRef.current = Date.now();
    startHeartbeatMonitoring();
  }, [startHeartbeatMonitoring]);

  const handleWebViewError = useCallback(() => {
    setConnectionStatus('failed');
    setIsLoading(false);
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
    setRetryCount(0);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setIsReconnecting(false);
    webViewRef.current?.reload();
  }, []);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'heartbeat') {
          // Update last heartbeat time
          lastHeartbeatRef.current = Date.now();
        } else if (data.type === 'connection-lost') {
          console.warn('Connection lost detected from WebView');
          handleConnectionLost();
        } else if (data.type === 'connection-restored') {
          console.log('Connection restored');
          setIsReconnecting(false);
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
        
        // Monitor iframe connection
        function monitorIframe() {
          const iframe = document.querySelector('iframe');
          if (!iframe) {
            console.warn('Iframe not found');
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
          // Send heartbeat every ${heartbeatInterval}ms
          heartbeatInterval = setInterval(sendHeartbeat, ${heartbeatInterval});
        } else {
          window.addEventListener('load', function() {
            monitorIframe();
            heartbeatInterval = setInterval(sendHeartbeat, ${heartbeatInterval});
          });
        }
        
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

  // Initial loading with random delay
  useEffect(() => {
    const loadingTime =
      Math.floor(Math.random() * (initialLoadingMax - initialLoadingMin)) + initialLoadingMin;
    const timer = setTimeout(() => {
      // Only auto-hide loading if WebView hasn't loaded yet
      // If WebView loads earlier, handleWebViewLoad will handle it
      setIsLoading((prevLoading) => {
        if (prevLoading) {
          setConnectionStatus('connected');
          return false;
        }
        return prevLoading;
      });
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [initialLoadingMin, initialLoadingMax]);

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
