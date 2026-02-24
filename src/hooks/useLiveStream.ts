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
          setIsLoading(false);
          setConnectionStatus('connected');
          setIsReconnecting(false);
          retryCountRef.current = 0;
          setRetryCount(0);
          return;
        }

        if (data.type === 'failed' || data.type === 'wsClose' || data.type === 'wsError') {
          setIsLoading(false);
          handleConnectionLost();
          return;
        }

        if (data.type === 'error') {
          // Có thể log error detail để debug RTC/MSE
          console.warn('Player error:', data.message, data.detail);
          setIsLoading(false);
          handleConnectionLost();
          return;
        }

        if (data.type === 'stalled') {
          setIsLoading(false);
          handleConnectionLost();
          return;
        }
      } catch {
        // ignore
      }
    },
    [handleConnectionLost, connectionStatus]
  );

  const getInjectedJavaScript = useCallback((): string => {
    return `
  (function () {
    // 1. CSS: universal hide + whitelist video/canvas/mute
    var s = document.createElement('style');
    s.textContent = [
      'html,body{background:#000!important;margin:0!important;padding:0!important;overflow:hidden!important;}',
      'video, canvas {',
      '  display:block!important; visibility:visible!important;',
      '  opacity:1!important; position:fixed!important;',
      '  top:0!important; left:0!important;',
      '  width:100vw!important; height:100vh!important;',
      '  object-fit:contain!important; z-index:1!important;',
      '  background:#000!important; pointer-events:auto!important;',
      '}',
      '#__rn_mute_btn {',
      '  display:flex!important; visibility:visible!important;',
      '  align-items:center!important; justify-content:center!important;',
      '  position:fixed!important; bottom:16px!important; right:16px!important;',
      '  z-index:9999999!important; width:44px!important; height:44px!important;',
      '  border-radius:50%!important; border:none!important;',
      '  background:rgba(0,0,0,0.55)!important; color:#fff!important;',
      '  font-size:22px!important; cursor:pointer!important;',
      '  pointer-events:auto!important; opacity:0.9!important;',
      '  -webkit-tap-highlight-color:transparent!important;',
      '}',
      '#__rn_mute_btn:active{opacity:1!important;transform:scale(0.92)!important;}'
    ].join('\\n');
    document.head.appendChild(s);

    // 2. DOM cleanup: walk up from media elements to mark parent chain, hide everything else
    function hideUnwantedElements() {
      var validSet = new Set();
      // Mark the mute button
      var mb = document.getElementById('__rn_mute_btn');
      if (mb) validSet.add(mb);
      // Find all media elements and mark their parent chain up to body
      var mediaEls = document.querySelectorAll('video, canvas, audio');
      mediaEls.forEach(function(m) {
        var node = m;
        while (node && node !== document.body) {
          validSet.add(node);
          node = node.parentElement;
        }
      });
      // Now hide everything not in the valid set
      var all = document.body.querySelectorAll('*');
      all.forEach(function(el) {
        var tag = el.tagName.toLowerCase();
        if (tag==='script'||tag==='style'||tag==='source') return;
        if (validSet.has(el)) {
          // Parent of media: strip decoration but keep visible
          if (tag!=='video'&&tag!=='canvas'&&tag!=='audio'&&el.id!=='__rn_mute_btn') {
            el.style.cssText='margin:0!important;padding:0!important;border:none!important;background:transparent!important;overflow:visible!important;';
          }
          return;
        }
        // Hide everything else
        el.style.cssText='display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;position:absolute!important;pointer-events:none!important;';
      });
    }
    hideUnwantedElements();
    setInterval(hideUnwantedElements, 300);

    // 3. Custom mute/unmute button
    var muteBtn = document.createElement('div');
    muteBtn.id = '__rn_mute_btn';
    muteBtn.textContent = '\\uD83D\\uDD07';
    var isMuted = true;
    function syncMute() {
      document.querySelectorAll('video').forEach(function(v){ v.muted = isMuted; });
      muteBtn.textContent = isMuted ? '\\uD83D\\uDD07' : '\\uD83D\\uDD0A';
    }
    function toggleMute(e) {
      e.stopPropagation(); e.preventDefault();
      isMuted = !isMuted;
      syncMute();
    }
    muteBtn.addEventListener('click', toggleMute);
    muteBtn.addEventListener('touchend', toggleMute);
    document.body.appendChild(muteBtn);
    setInterval(syncMute, 1000);

    // 4. Stream status detection
    var send = function(type, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:type}, data||{})));
    };
    var lastFrame = Date.now();
    var playing = false;
    function waitCanvas(){
      var canvas = document.querySelector('canvas');
      if(!canvas){ requestAnimationFrame(waitCanvas); return; }
      var ctx = canvas.getContext('2d');
      function detect(){
        try{
          var p = ctx.getImageData(0,0,1,1).data;
          if(p[0]||p[1]||p[2]){
            lastFrame = Date.now();
            if(!playing){ playing=true; send('playing'); }
          }
          if(Date.now()-lastFrame>4000){ playing=false; send('stalled'); }
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
