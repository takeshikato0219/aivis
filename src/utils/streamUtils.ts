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
    return `${baseUrl}/stream.html?src=${encodeURIComponent(src)}&mode=webrtc,mse,hls,mjpeg&autoplay=true`;
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
      // ✅ Xóa style #__rn_mute_btn
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

    // ✅ Nhận lệnh mute từ React Native
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
    // Android
    window.addEventListener('message', function(e) { handleMuteMessage(e.data); });
    // iOS WKWebView
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
    setTimeout(init, 500);
    setTimeout(init, 1500);
    setTimeout(init, 3000);

    // Health check: send heartbeat/playing/stalled to React Native
    var _lastTime = 0;
    var _stallCount = 0;
    var _isPlaying = false;
    function sendRN(type, data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:type}, data||{})));
        }
      } catch(e){}
    }
    setInterval(function(){
      var video = document.querySelector('video');
      var canvas = document.querySelector('canvas');
      // Check video element
      if (video) {
        if (video.readyState >= 2 && !video.paused && video.currentTime > _lastTime) {
          _lastTime = video.currentTime;
          _stallCount = 0;
          if (!_isPlaying) { _isPlaying = true; sendRN('playing'); }
          sendRN('heartbeat');
        } else if (video.readyState >= 2) {
          _stallCount++;
          if (_stallCount >= 3) { _isPlaying = false; sendRN('stalled'); _stallCount = 0; }
        }
        return;
      }
      // Check canvas element
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
            if (_stallCount >= 3) { _isPlaying = false; sendRN('stalled'); _stallCount = 0; }
          }
        } catch(e){}
      }
    }, 3000);

    true;
  })();`;
}

/**
 * Tạo inline HTML page cho iOS WebView — load stream trực tiếp qua go2rtc API,
 * không dùng stream.html (tránh logo, controls, header của go2rtc).
 *
 * Trên iOS WKWebView, WebRTC không khả dụng nên dùng MSE → HLS → MJPEG fallback.
 * Page chỉ chứa 1 video element full-screen, không có UI chrome.
 *
 * @param wsUrl  - WebSocket URL gốc (wss://…/api/ws?src=camera&token=…)
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
  const mjpegUrl = `${baseUrl}/api/frame.jpeg?src=${encodeURIComponent(src)}${token ? '&token=' + encodeURIComponent(token) : ''}`;

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

  // ✅ Nhận lệnh mute từ React Native
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

  // Try MSE first (MediaSource Extensions)
  function tryMSE() {
    if (!window.MediaSource) { tryHLS(); return; }
    try {
      var wsUrl = '${wsUrl}';
      var ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      var ms = new MediaSource();
      video.src = URL.createObjectURL(ms);

      var sb; var queue = []; var adding = false;

      ms.addEventListener('sourceopen', function(){
        ws.onopen = function(){
          ws.send(JSON.stringify({type:'mse'}));
        };
        ws.onmessage = function(e){
          if (typeof e.data === 'string') {
            try {
              var msg = JSON.parse(e.data);
              if (msg.type === 'mse') {
                var codec = msg.value || 'video/mp4; codecs="avc1.640029"';
                if (MediaSource.isTypeSupported(codec)) {
                  sb = ms.addSourceBuffer(codec);
                  sb.mode = 'segments';
                  sb.addEventListener('updateend', flushQueue);
                }
              }
            } catch(ex){}
            return;
          }
          if (sb) {
            queue.push(e.data);
            flushQueue();
          }
        };
      });

      function flushQueue(){
        if (adding || !sb || queue.length === 0) return;
        if (sb.updating) return;
        adding = true;
        try { sb.appendBuffer(queue.shift()); }
        catch(ex){ console.error(ex); }
        adding = false;
      }

      ws.onerror = function(){ tryHLS(); };
      ws.onclose = function(){
        if (!video.src || video.error) tryHLS();
        else {
          // Auto-reconnect MSE WebSocket with backoff
          _wsRetry++;
          if (_wsRetry <= 3) {
            sendRN('stalled');
            setTimeout(function(){ tryMSE(); }, Math.min(2000 * Math.pow(2, _wsRetry - 1), 8000));
          } else {
            sendRN('wsClose');
            tryHLS();
          }
        }
      };

      setTimeout(function(){
        if (video.readyState < 2) { ws.close(); tryHLS(); }
      }, 5000);

    } catch(e) { tryHLS(); }
  }

  // HLS fallback
  function tryHLS() {
    video.src = '${hlsUrl}';
    video.muted = true;
    video.play().catch(function(){});
    setTimeout(function(){
      if (video.readyState < 2) tryMJPEG();
    }, 5000);
  }

  // MJPEG fallback
  function tryMJPEG() {
    video.style.display = 'none';
    var img = document.createElement('img');
    img.src = '${mjpegUrl}';
    img.style.cssText = 'position:fixed;top:50%;left:50%;min-width:100vw;min-height:100vh;width:auto;height:auto;transform:translate(-50%,-50%);z-index:1;background:#000;';
    document.body.appendChild(img);
    // Report playing when MJPEG image loads
    img.onload = function(){ sendRN('playing'); };
  }

  // Health reporting to React Native
  function sendRN(type, data) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:type}, data||{})));
      }
    } catch(e){}
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
    } else if (video && video.readyState >= 2) {
      _stallCount++;
      if (_stallCount >= 3) { _isPlaying = false; sendRN('stalled'); _stallCount = 0; }
    }
  }, 3000);

  video.muted = true;
  tryMSE();
})();
</script>
</body>
</html>`;

  return { html, baseUrl };
}
