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
  // Wrap RTSP URL in stream wrapper
  return `${baseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg`;
};

/**
 * Generate HTML template for WebView stream display
 * @param streamUrl - Stream URL to display in iframe
 * @returns HTML string for WebView
 */
export const getStreamHTML = (streamUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
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
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      </style>
    </head>
    <body>
      <div id="stream-container">
        <iframe 
          src="${streamUrl}" 
          allow="camera; microphone; autoplay; fullscreen"
          allowfullscreen
          frameborder="0"
        ></iframe>
      </div>
      <script>
        window.addEventListener('error', function(e) {
          e.preventDefault();
        });
        
        // Log readiness
        window.addEventListener('load', function() {
          console.log('Stream iframe loaded');
        });
      </script>
    </body>
    </html>
  `;
};
