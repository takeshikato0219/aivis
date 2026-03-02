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
 * Ẩn logo, progress, thời gian, chỉ giữ nút loa (Android: native, iOS: custom).
 * @param platform 'ios' | 'android'
 */
export function getInjectedStreamPlayerJS(platform: 'ios' | 'android'): string {
  return `(() => {
    var isIOS = ${platform === 'ios'};
    var style = document.createElement('style');
    style.textContent = [
      '* { margin:0 !important; padding:0 !important; box-sizing:border-box; }',
      'html, body { width:100%; height:100%; overflow:hidden !important; background:#000 !important; }',
      'video {',
      '  position:fixed !important; top:0 !important; left:0 !important;',
      '  width:100% !important; height:100% !important;',
      '  object-fit:cover !important; background:#000 !important;',
      '  z-index:1 !important;',
      '}',
      'header, footer, nav, .header, .footer, .mode, .status, .info, #info,',
      '.title, #title, [class*="logo"], [class*="badge"], [class*="mode"],',
      '[class*="toolbar"], [class*="header"], [class*="footer"],',
      'img[src*="logo"], div:not(:has(video)), span, p, a, button,',
      'select, input, label, h1, h2, h3, h4, h5, h6 {',
      '  display:none !important;',
      '}',
      'html, body, body > * { display:block !important; }',
      'video::-webkit-media-controls-play-button { display:none !important; }',
      'video::-webkit-media-controls-timeline { display:none !important; }',
      'video::-webkit-media-controls-current-time-display { display:none !important; }',
      'video::-webkit-media-controls-time-remaining-display { display:none !important; }',
      'video::-webkit-media-controls-fullscreen-button { display:none !important; }',
      'video::-webkit-media-controls-toggle-closed-captions-button { display:none !important; }',
      'video::-webkit-media-controls-overflow-button { display:none !important; }',
      'video::-webkit-media-controls-seek-back-button { display:none !important; }',
      'video::-webkit-media-controls-seek-forward-button { display:none !important; }',
      'video::-webkit-media-controls-rewind-button { display:none !important; }',
      'video::-webkit-media-controls-return-to-realtime-button { display:none !important; }',
      'video::-webkit-media-controls-panel { background:transparent !important; }',
      'video::-webkit-media-controls-enclosure { overflow:hidden !important; }',
      'video::-webkit-media-controls-start-playback-button { display:none !important; }',
      'video::-webkit-media-text-track-display { display:none !important; }',
      '::-webkit-scrollbar { display:none !important; width:0 !important; }',
    ].join('\\n');
    document.head.appendChild(style);
    function processVideo(v) {
      v.style.cssText = 'position:fixed!important;top:0!important;left:0!important;' +
        'width:100%!important;height:100%!important;object-fit:cover!important;' +
        'background:#000!important;z-index:1!important;';
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.removeAttribute('controls');
      if (v.paused) v.play().catch(function(){});
      if (isIOS) {
        setTimeout(function() { createMuteButton(v); }, 500);
      } else {
        v.setAttribute('controls', '');
      }
    }
    function createMuteButton(video) {
      if (document.getElementById('custom-mute-btn')) return;
      var btn = document.createElement('div');
      btn.style.position = 'fixed';
      btn.style.bottom = '16px';
      btn.style.right = '16px';
      btn.style.width = '44px';
      btn.style.height = '44px';
      btn.style.borderRadius = '50%';
      btn.style.background = 'rgba(0,0,0,0.6)';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '20px';
      btn.style.color = '#fff';
      btn.style.zIndex = '9999';
      btn.style.cursor = 'pointer';
      function update() {
        btn.innerHTML = video.muted ? '🔇' : '🔊';
      }
      btn.onclick = function(e) {
        e.stopPropagation();
        video.muted = !video.muted;
        update();
      };
      video.addEventListener('volumechange', update);
      update();
      document.body.appendChild(btn);
      video.play().catch(function(){});
    }
    var observer = new MutationObserver(function() {
      if (document.querySelector('video')) {
        init();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(init, 1000);
    true;
  })();`;
}
