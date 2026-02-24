/**
 * Build stream URL from RTSP URL
 * @param rtspUrl - RTSP URL or full HTTP/HTTPS URL
 * @param baseUrl - Base URL for stream wrapper (default: 'https://avisaitest-nginx001.wpstories.org')
 * @returns Formatted stream URL
 */
export const buildStreamUrl = (
  rtspUrl?: string,
  baseUrl: string = 'https://avisaitest-nginx001.wpstories.org'
): string => {
  const src = rtspUrl || 'camera';

  if (rtspUrl?.startsWith('http://') || rtspUrl?.startsWith('https://')) {
    return rtspUrl;
  }
  return `${baseUrl}/stream.html?src=${encodeURIComponent(src)}&mode=mse&autoplay=true`;
};

/**
 * Generate HTML template for WebView stream display
 * @param streamUrl - Stream URL to display in iframe with auto-start
 * @returns HTML string for WebView with auto-playing stream
 */
export const getStreamHTML = (streamUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
          -webkit-overflow-scrolling: touch;
        }
        #stream-container {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        #loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 1000;
          pointer-events: none;
        }
        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid #fff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div id="stream-container">
        <div id="loading">
          <div class="spinner"></div>
          <div>Loading stream...</div>
        </div>
        <iframe 
          id="stream-iframe"
          src="${streamUrl}" 
          allow="camera; microphone; autoplay; fullscreen"
          allowfullscreen
        ></iframe>
      </div>
      <script>
        (function() {
          var iframe = document.getElementById('stream-iframe');
          var loading = document.getElementById('loading');
          var streamStarted = false;
          var hideLoadingTimeout = null;

          // CSS to inject into iframe
          var hideCSS = [
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

          function injectHideCSS(doc) {
            try {
              var s = doc.createElement('style');
              s.textContent = hideCSS;
              doc.head.appendChild(s);
            } catch(e) {}
          }

          function hideIframeElements(doc) {
            try {
              var validSet = new Set();
              var mb = doc.getElementById('__rn_mute_btn');
              if (mb) validSet.add(mb);
              var mediaEls = doc.querySelectorAll('video, canvas, audio');
              mediaEls.forEach(function(m) {
                var node = m;
                while (node && node !== doc.body) {
                  validSet.add(node);
                  node = node.parentElement;
                }
              });
              var all = doc.body.querySelectorAll('*');
              all.forEach(function(el) {
                var tag = el.tagName.toLowerCase();
                if (tag==='script'||tag==='style'||tag==='source') return;
                if (validSet.has(el)) {
                  if (tag!=='video'&&tag!=='canvas'&&tag!=='audio'&&el.id!=='__rn_mute_btn') {
                    el.style.cssText='margin:0!important;padding:0!important;border:none!important;background:transparent!important;overflow:visible!important;';
                  }
                  return;
                }
                el.style.cssText='display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;position:absolute!important;pointer-events:none!important;';
              });
            } catch(e) {}
          }

          function createMuteBtn(doc) {
            try {
              if (doc.getElementById('__rn_mute_btn')) return;
              var mb = doc.createElement('div');
              mb.id = '__rn_mute_btn';
              mb.textContent = '\\uD83D\\uDD07';
              var muted = true;
              function syncMute() {
                doc.querySelectorAll('video').forEach(function(v){ v.muted = muted; });
                mb.textContent = muted ? '\\uD83D\\uDD07' : '\\uD83D\\uDD0A';
              }
              function toggle(e) {
                e.stopPropagation(); e.preventDefault();
                muted = !muted;
                syncMute();
              }
              mb.addEventListener('click', toggle);
              mb.addEventListener('touchend', toggle);
              doc.body.appendChild(mb);
              setInterval(syncMute, 1000);
            } catch(e) {}
          }
          
          // Error handling
          window.addEventListener('error', function(e) {
            console.error('Window error:', e.message);
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'error',
              message: e.message
            }));
          });
          
          // Hide loading after iframe loads
          iframe.addEventListener('load', function() {
            console.log('Iframe loaded');
            
            setTimeout(function() {
              try {
                var iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  // Inject CSS to hide controls inside iframe
                  injectHideCSS(iframeDoc);
                  hideIframeElements(iframeDoc);
                  createMuteBtn(iframeDoc);
                  // Keep hiding dynamically added elements
                  setInterval(function() { hideIframeElements(iframeDoc); }, 500);

                  // Try to find and click play/start button
                  var playButtons = iframeDoc.querySelectorAll('button, [role="button"], .play-button, #play-button');
                  playButtons.forEach(function(btn) {
                    if (btn.textContent && (
                      btn.textContent.toLowerCase().includes('play') ||
                      btn.textContent.toLowerCase().includes('start') ||
                      btn.textContent.toLowerCase().includes('webrtc') ||
                      btn.textContent.toLowerCase().includes('mse')
                    )) {
                      console.log('Auto-clicking button:', btn.textContent);
                      btn.click();
                    }
                  });
                  
                  // Try to find video element and check if playing
                  var videos = iframeDoc.querySelectorAll('video');
                  if (videos.length > 0) {
                    videos.forEach(function(video) {
                      video.addEventListener('playing', function() {
                        console.log('Video playing detected');
                        if (!streamStarted) {
                          streamStarted = true;
                          loading.style.display = 'none';
                          window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'playing'
                          }));
                        }
                      });
                      
                      // Try to play if paused
                      if (video.paused) {
                        video.play().catch(function(err) {
                          console.log('Auto-play failed:', err);
                        });
                      }
                    });
                  }
                }
              } catch(e) {
                // CORS error expected for cross-origin iframe
                console.log('Cannot access iframe content (CORS)');
              }
              
              // Hide loading after 3 seconds regardless (assume stream started)
              hideLoadingTimeout = setTimeout(function() {
                loading.style.display = 'none';
                if (!streamStarted) {
                  streamStarted = true;
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'streamReady'
                  }));
                }
              }, 3000);
            }, 1000);
          });
          
          // Handle iframe errors
          iframe.addEventListener('error', function() {
            console.error('Iframe error');
            loading.style.display = 'none';
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'streamError',
              error: 'Failed to load stream'
            }));
          });
          
          // Heartbeat monitoring
          setInterval(function() {
            if (streamStarted) {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now()
              }));
            }
          }, 10000);
          
          // Network status monitoring
          window.addEventListener('online', function() {
            console.log('Network online');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'connection-restored',
              reason: 'network-online'
            }));
            // Reload iframe on network restore
            var currentSrc = iframe.src;
            iframe.src = '';
            setTimeout(function() {
              iframe.src = currentSrc;
            }, 100);
          });
          
          window.addEventListener('offline', function() {
            console.warn('Network offline');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'connection-lost',
              reason: 'network-offline'
            }));
          });
          
          console.log('Stream player initialized with URL:', '${streamUrl}');
        })();
      </script>
    </body>
    </html>
  `;
};
