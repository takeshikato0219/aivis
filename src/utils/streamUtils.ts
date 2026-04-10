/**
 * Build stream URL from RTSP URL
 * @param rtspUrl - RTSP URL or full HTTP/HTTPS URL
 * @returns Formatted stream URL
 */
export const buildStreamUrl = (rtspUrl?: string): string => {
  if (!rtspUrl) return '';
  if (rtspUrl.startsWith('http://') || rtspUrl.startsWith('https://')) {
    return rtspUrl;
  }
  return '';
};

/**
 * Extract base domain from a WebSocket or HTTP URL and build a stream.html URL.
 * Example input:  wss://avisaitest-nginx001.wpstories.org/api/ws?src=camera&token=xxx
 * Example output: https://avisaitest-nginx001.wpstories.org/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg&autoplay=true
 *
 * @param wsUrl - WebSocket URL returned by API (e.g. live_url)
 * @returns Full HTTPS stream.html URL, or empty string if input is invalid
 */
export const buildStreamHtmlUrl = (wsUrl?: string): string => {
  if (!wsUrl) return '';
  try {
    // Replace ws(s):// with http(s):// so URL can parse it
    const httpUrl = wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
    const parsed = new URL(httpUrl);
    // Extract the `src` query param (camera source identifier)
    const src = parsed.searchParams.get('src') || 'camera';
    const baseUrl = `${parsed.protocol}//${parsed.host}`;
    return `${baseUrl}/stream.html?src=${encodeURIComponent(src)}&mode=mse,hls&autoplay=true`;
  } catch {
    return '';
  }
};

/**
 * Sinh ra injectedJavaScript cho WebView stream player.
 * Ẩn logo, progress, thời gian, chỉ giữ video/canvas full-screen.
 * Android: hiện native controls. iOS: ẩn controls, hiện custom mute button.
 * @param platform 'ios' | 'android'
 */
export function getInjectedStreamPlayerJS(platform: 'ios' | 'android'): string {
  return `(function(){
    var isIOS = ${platform === 'ios'};

    function sendRN(type, data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:type}, data||{})));
        }
      } catch(e){}
    }

    sendRN('jsReady');

    (function() {
      var OrigWS = window.WebSocket;
      if (window.__wsPatched) return;
      window.__wsPatched = true;
      window.__openSockets = [];
      window.WebSocket = function(url, protocols) {
        var ws = protocols ? new OrigWS(url, protocols) : new OrigWS(url);
        window.__openSockets.push(ws);
        ws.addEventListener('close', function() {
          window.__openSockets = window.__openSockets.filter(function(s){ return s !== ws; });
        });
        return ws;
      };
      window.WebSocket.prototype = OrigWS.prototype;
      window.WebSocket.CONNECTING = OrigWS.CONNECTING;
      window.WebSocket.OPEN = OrigWS.OPEN;
      window.WebSocket.CLOSING = OrigWS.CLOSING;
      window.WebSocket.CLOSED = OrigWS.CLOSED;
    })();

    var s = document.createElement('style');
    s.textContent = [
      'html,body{background:#000!important;margin:0!important;padding:0!important;overflow:hidden!important;width:100%!important;height:100%!important;}',
      'video, canvas {',
      '  display:block!important; visibility:visible!important;',
      '  opacity:1!important; position:fixed!important;',
      '  top:0!important; left:0!important;',
      '  width:100vw!important; height:100vh!important;',
      '  object-fit:cover!important; z-index:1!important;',
      '  background:#000!important; pointer-events:auto!important;',
      '}',
      'video::-webkit-media-controls-play-button,',
      'video::-webkit-media-controls-timeline,',
      'video::-webkit-media-controls-current-time-display,',
      'video::-webkit-media-controls-time-remaining-display,',
      'video::-webkit-media-controls-fullscreen-button,',
      'video::-webkit-media-controls-toggle-closed-captions-button,',
      'video::-webkit-media-controls-overflow-button,',
      'video::-webkit-media-controls-seek-back-button,',
      'video::-webkit-media-controls-seek-forward-button,',
      'video::-webkit-media-controls-rewind-button,',
      'video::-webkit-media-controls-return-to-realtime-button,',
      'video::-webkit-media-controls-start-playback-button,',
      'video::-webkit-media-text-track-display {',
      '  display:none!important;',
      '}',
      'video::-webkit-media-controls-panel{background:transparent!important;}',
      'video::-webkit-media-controls-enclosure{overflow:hidden!important;}',
      '::-webkit-scrollbar{display:none!important;width:0!important;}',
    ].join('\\n');
    document.head.appendChild(s);

    function hideUnwantedElements() {
      var validSet = new Set();
      var mediaEls = document.querySelectorAll('video, canvas, audio');
      mediaEls.forEach(function(m) {
        var node = m;
        while (node && node !== document.body) {
          validSet.add(node);
          node = node.parentElement;
        }
      });
      var all = document.body.querySelectorAll('*');
      all.forEach(function(el) {
        var tag = el.tagName.toLowerCase();
        if (tag==='script'||tag==='style'||tag==='source') return;
        if (validSet.has(el)) {
          if (tag!=='video'&&tag!=='canvas'&&tag!=='audio') {
            el.style.cssText='margin:0!important;padding:0!important;border:none!important;background:transparent!important;overflow:visible!important;';
          }
          return;
        }
        el.style.cssText='display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;position:absolute!important;pointer-events:none!important;';
      });
    }
    hideUnwantedElements();
    setInterval(hideUnwantedElements, 300);

    function processVideo(v) {
      v.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;' +
        'position:fixed!important;top:0!important;left:0!important;' +
        'width:100vw!important;height:100vh!important;object-fit:cover!important;' +
        'background:#000!important;z-index:1!important;pointer-events:auto!important;';
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('autoplay', '');
      v.removeAttribute('controls');
      v.muted = true;
      if (v.paused) v.play().catch(function(){});
    }

    function handleMuteMessage(data) {
      try {
        var msg = JSON.parse(data);
        if (msg.type === 'SET_MUTE') {
          document.querySelectorAll('video').forEach(function(v) {
            v.muted = msg.muted;
          });
        }
      } catch(ex) {}
    }
    window.addEventListener('message', function(e) { handleMuteMessage(e.data); });
    document.addEventListener('message', function(e) { handleMuteMessage(e.data); });

    function init() {
      var videos = document.querySelectorAll('video');
      videos.forEach(function(v) { processVideo(v); });
      hideUnwantedElements();
    }

    var observer = new MutationObserver(function() {
      if (document.querySelector('video') || document.querySelector('canvas')) {
        init();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    [500, 1000, 1500, 2500, 4000, 6000].forEach(function(ms){ setTimeout(init, ms); });

    var playRetries = 0;
    var playInterval = setInterval(function(){
      document.querySelectorAll('video').forEach(function(v){
        if (v && v.paused && (v.readyState >= 1 || v.src || v.srcObject)) v.play().catch(function(){});
      });
      playRetries++;
      if (playRetries >= 30) clearInterval(playInterval);
    }, 500);

    var _lastTime = 0;
    var _stallCount = 0;
    var _isPlaying = false;

    setInterval(function(){
      var video = document.querySelector('video');
      var canvas = document.querySelector('canvas');
      if (video) {
        if (video.readyState >= 2 && !video.paused && video.currentTime > _lastTime) {
          _lastTime = video.currentTime;
          _stallCount = 0;
          if (!_isPlaying) { _isPlaying = true; sendRN('playing'); }
          sendRN('heartbeat');
        } else if (video.readyState >= 2 && !video.paused && video.currentTime === 0 && !_isPlaying) {
          sendRN('buffering');
        } else if (video.readyState < 2) {
          sendRN('buffering');
        } else if (video.readyState >= 2) {
          _stallCount++;
          if (_stallCount >= 10) { _isPlaying = false; sendRN('stalled'); _stallCount = 0; }
        }
        return;
      }
      if (canvas) {
        try {
          var ctx = canvas.getContext('2d');
          var p = ctx.getImageData(0,0,1,1).data;
          if (p[0]||p[1]||p[2]) {
            _stallCount = 0;
            if (!_isPlaying) { _isPlaying = true; sendRN('playing'); }
            sendRN('heartbeat');
          } else {
            _stallCount++;
            if (_stallCount >= 10) { _isPlaying = false; sendRN('stalled'); _stallCount = 0; }
          }
        } catch(e){}
      }
      if (!video && !canvas) { sendRN('buffering'); }
    }, 3000);

    window.__playerStop = function() {
      document.querySelectorAll('video, audio').forEach(function(el) {
        try {
          el.pause();
          el.muted = true;
          el.srcObject = null;
          el.src = '';
          el.load();
        } catch(e) {}
      });
      if (window.__openSockets) {
        window.__openSockets.forEach(function(ws) {
          try { ws.close(); } catch(e) {}
        });
        window.__openSockets = [];
      }
    };

    window.__playerStart = function() {
      sendRN('needReload');
    };

    true;
  })();`;
}

/**
 * @param wsUrl - (wss://…/api/ws?src=camera&token=…)
 * @returns {{ html: string; baseUrl: string }}
 */
export function buildIOSStreamInlineHtml(wsUrl: string): { html: string; baseUrl: string } {
  const httpUrl = wsUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
  let parsed: URL;
  try {
    parsed = new URL(httpUrl);
  } catch {
    return { html: '', baseUrl: '' };
  }
  const src = parsed.searchParams.get('src') || 'camera';
  const token = parsed.searchParams.get('token') || '';
  const baseUrl = `${parsed.protocol}//${parsed.host}`;
  const hlsUrl = `${baseUrl}/api/stream.m3u8?src=${encodeURIComponent(src)}${token ? '&token=' + encodeURIComponent(token) : ''}`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:#000;}
video{
  position:fixed;top:0;left:0;width:100vw;height:100vh;
  object-fit:cover;background:#000;z-index:1;
}
video::-webkit-media-controls{display:none!important;-webkit-appearance:none;}
video::-webkit-media-controls-enclosure{display:none!important;-webkit-appearance:none;}
video::-webkit-media-controls-panel{display:none!important;-webkit-appearance:none;}
video::-webkit-media-controls-start-playback-button{display:none!important;-webkit-appearance:none;}
video::-webkit-media-controls-play-button{display:none!important;}
video::-webkit-media-controls-timeline{display:none!important;}
video::-webkit-media-controls-current-time-display{display:none!important;}
video::-webkit-media-controls-time-remaining-display{display:none!important;}
video::-webkit-media-controls-fullscreen-button{display:none!important;}
video::-webkit-media-controls-overflow-button{display:none!important;}
video::-webkit-media-controls-volume-slider{display:none!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
</style>
</head>
<body>
<video id="v" playsinline webkit-playsinline autoplay muted></video>
<script>
(function(){
  var video = document.getElementById('v');
  var _wsRetry = 0;
  var _lastDataTS = 0;
  var _healthCheckTID = null;
  var _currentWs = null;
  var HEALTH_CHECK_INTERVAL = 3000;
  var RECONNECT_TIMEOUT = 5000;

  // Supported codecs (matching web video-rtc.ts)
  var CODECS = [
    'avc1.640029','avc1.64002A','avc1.640033',
    'hvc1.1.6.L153.B0',
    'mp4a.40.2','mp4a.40.5','flac','opus'
  ];

  // Safari codec compatibility
  var safariMatch = navigator.userAgent.match(/Version\\/(\\d+).+Safari/);
  if (safariMatch) {
    var ver = parseInt(safariMatch[1]);
    var skipFrom = ver < 13 ? 'mp4a.40.2' : ver < 14 ? 'flac' : 'opus';
    var idx = CODECS.indexOf(skipFrom);
    if (idx > -1) CODECS.splice(idx);
  }

  function getSupportedCodecs(isSupported) {
    return CODECS.filter(function(c) {
      return isSupported('video/mp4; codecs="' + c + '"');
    }).join();
  }

  function sendRN(type, data) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:type}, data||{})));
      }
    } catch(e){}
  }

  sendRN('jsReady');

  function handleMuteMessage(data) {
    try {
      var msg = JSON.parse(data);
      if (msg.type === 'SET_MUTE') {
        video.muted = msg.muted;
      }
    } catch(ex) {}
  }
  window.addEventListener('message', function(e) { handleMuteMessage(e.data); });
  document.addEventListener('message', function(e) { handleMuteMessage(e.data); });

  function stopHealthCheck() {
    if (_healthCheckTID) { clearInterval(_healthCheckTID); _healthCheckTID = null; }
  }

  function startHealthCheck() {
    stopHealthCheck();
    _lastDataTS = Date.now();
    _healthCheckTID = setInterval(function() {
      if (!_currentWs || _currentWs.readyState !== 1) return;
      var elapsed = Date.now() - _lastDataTS;
      if (elapsed >= HEALTH_CHECK_INTERVAL) {
        sendRN('healthTimeout');
        stopHealthCheck();
        if (_currentWs) { _currentWs.close(); _currentWs = null; }
      }
    }, Math.min(HEALTH_CHECK_INTERVAL, 5000));
  }

  // ── HLS fallback (iOS < 17 không có MediaSource) ──
  function tryHLS() {
    sendRN('protocol', { protocol: 'hls' });
    sendRN('buffering');
    video.src = '${hlsUrl}';
    video.muted = true;
    video.play().catch(function(){});
  }

  // ── MSE (Android only — iOS WKWebView MSE/ManagedMediaSource unreliable) ──
  function tryMSE() {
    // iOS WKWebView: ManagedMediaSource exists but doesn't work reliably → always use HLS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      tryHLS();
      return;
    }

    sendRN('protocol', { protocol: 'mse' });

    var MSClass = window.MediaSource;
    if (!MSClass) {
      tryHLS();
      return;
    }

    try {
      var connectTS = Date.now();
      var wsUrl = '${wsUrl}';
      var ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      _currentWs = ws;

      var ms = new MSClass();
      video.src = URL.createObjectURL(ms);
      video.srcObject = null;

      video.play().catch(function(){});

      var sb = null;
      // Pre-allocated 2MB buffer (matching web)
      var buf = new Uint8Array(2 * 1024 * 1024);
      var bufLen = 0;

      ws.onopen = function() {
        sendRN('buffering');
        startHealthCheck();
      };

      ms.addEventListener('sourceopen', function() {
        // Send supported codecs (matching web)
        var codecStr = getSupportedCodecs(function(type) {
          return MSClass.isTypeSupported(type);
        });
        ws.send(JSON.stringify({ type: 'mse', value: codecStr }));
        sendRN('buffering');

        ws.onmessage = function(e) {
          if (typeof e.data === 'string') {
            try {
              var msg = JSON.parse(e.data);
              if (msg.type === 'mse' && msg.value) {
                sb = ms.addSourceBuffer(msg.value);
                sb.mode = 'segments';
                sb.addEventListener('updateend', function() {
                  // Flush pending buffer
                  if (!sb.updating && bufLen > 0) {
                    try {
                      var data = buf.slice(0, bufLen);
                      sb.appendBuffer(data);
                      bufLen = 0;
                    } catch(ex) {}
                  }
                  // Buffer management: keep only 5s (matching web)
                  if (!sb.updating && sb.buffered && sb.buffered.length) {
                    var end = sb.buffered.end(sb.buffered.length - 1);
                    var start = end - 5;
                    var start0 = sb.buffered.start(0);
                    if (start > start0) {
                      sb.remove(start0, start);
                      ms.setLiveSeekableRange(start, end);
                    }
                    if (video.currentTime < start) {
                      video.currentTime = start;
                    }
                    // Adjust playback rate to stay in sync (matching web)
                    var gap = end - video.currentTime;
                    video.playbackRate = gap > 0.1 ? gap : 0.1;
                  }
                });
              }
              if (msg.type === 'error') {
                sendRN('failed', { message: msg.value });
              }
            } catch(ex){}
            return;
          }
          // Binary data
          _lastDataTS = Date.now();
          if (sb) {
            if (sb.updating || bufLen > 0) {
              var b = new Uint8Array(e.data);
              buf.set(b, bufLen);
              bufLen += b.byteLength;
            } else {
              try { sb.appendBuffer(e.data); }
              catch(ex) {}
            }
          }
        };
      });

      ws.onerror = function() { sendRN('wsError'); };
      ws.onclose = function() {
        stopHealthCheck();
        _currentWs = null;
        _wsRetry++;
        if (_wsRetry <= 3) {
          sendRN('buffering');
          var delay = Math.max(RECONNECT_TIMEOUT - (Date.now() - connectTS), 0);
          setTimeout(function(){ tryMSE(); }, delay);
        } else {
          sendRN('wsClose');
        }
      };

      video.addEventListener('error', function() {
        if (_currentWs) { _currentWs.close(); _currentWs = null; }
      });

    } catch(e) { sendRN('failed', { message: e.message }); }
  }

  var _lastTime = 0;
  var _stallCount = 0;
  var _isPlaying = false;
  setInterval(function(){
    if (video && video.readyState >= 2 && !video.paused && video.currentTime > _lastTime) {
      _lastTime = video.currentTime;
      _stallCount = 0;
      if (!_isPlaying) { _isPlaying = true; sendRN('playing'); }
      sendRN('heartbeat');
    } else if (video && video.readyState >= 2 && !video.paused && video.currentTime === 0 && !_isPlaying) {
      sendRN('buffering');
    } else if (video && video.readyState < 2) {
      sendRN('buffering');
    } else if (video && video.readyState >= 2) {
      _stallCount++;
      if (_stallCount >= 10) { _isPlaying = false; sendRN('stalled'); _stallCount = 0; }
    }
  }, 3000);

  video.muted = true;
  var playRetryCount = 0;
  var playRetryInterval = setInterval(function(){
    if (video && video.paused && (video.readyState >= 1 || video.src || video.srcObject)) {
      video.play().catch(function(){});
    }
    playRetryCount++;
    if (playRetryCount >= 30) clearInterval(playRetryInterval);
  }, 500);

  tryMSE();
})();
</script>
</body>
</html>`;

  return { html, baseUrl };
}
