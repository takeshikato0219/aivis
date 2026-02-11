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
  if (!rtspUrl) {
    return `${baseUrl}/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg`;
  }
  // If already a full URL, return as is
  if (rtspUrl.startsWith('http://') || rtspUrl.startsWith('https://')) {
    return rtspUrl;
  }
  // Use go2rtc embed player with autoplay enabled
  // This bypasses the settings/mode selection screen
  return `${baseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg&autoplay=true`;
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
          const iframe = document.getElementById('stream-iframe');
          const loading = document.getElementById('loading');
          let streamStarted = false;
          let hideLoadingTimeout = null;
          
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
            
            // Try to auto-click play button or mode selector in iframe (may fail due to CORS)
            setTimeout(function() {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  // Try to find and click play/start button
                  const playButtons = iframeDoc.querySelectorAll('button, [role="button"], .play-button, #play-button');
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
                  const videos = iframeDoc.querySelectorAll('video');
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
            const currentSrc = iframe.src;
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
