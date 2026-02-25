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
  if (!rtspUrl) return '';
  if (rtspUrl.startsWith('http://') || rtspUrl.startsWith('https://')) {
    return rtspUrl;
  }
  return `${baseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg&autoplay=true`;
};
