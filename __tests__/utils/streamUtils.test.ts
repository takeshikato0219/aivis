import { buildStreamUrl } from '../../src/utils/streamUtils';

describe('streamUtils', () => {
  const mockBaseUrl = 'https://avisaitest-nginx001.wpstories.org';

  describe('buildStreamUrl', () => {
    it('should return empty string when no rtspUrl is provided', () => {
      const result = buildStreamUrl();

      expect(result).toBe('');
    });

    it('should return the URL as-is when it starts with http://', () => {
      const httpUrl = 'http://example.com/stream';
      const result = buildStreamUrl(httpUrl);

      expect(result).toBe(httpUrl);
    });

    it('should return the URL as-is when it starts with https://', () => {
      const httpsUrl = 'https://example.com/stream';
      const result = buildStreamUrl(httpsUrl);

      expect(result).toBe(httpsUrl);
    });

    it('should wrap RTSP URL with base URL and encode it using stream.html with autoplay', () => {
      const rtspUrl = 'rtsp://192.168.1.100:554/live';
      const result = buildStreamUrl(rtspUrl);
      const expected = `${mockBaseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg&autoplay=true`;

      expect(result).toBe(expected);
    });

    it('should handle RTSP URLs with special characters', () => {
      const rtspUrl = 'rtsp://user:pass@192.168.1.100:554/live?param=value&other=test';
      const result = buildStreamUrl(rtspUrl);
      const expected = `${mockBaseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg&autoplay=true`;

      expect(result).toBe(expected);
    });

    it('should use custom base URL when provided', () => {
      const customBaseUrl = 'https://custom-stream.example.com';
      const rtspUrl = 'rtsp://camera.local/live';
      const result = buildStreamUrl(rtspUrl, customBaseUrl);
      const expected = `${customBaseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg&autoplay=true`;

      expect(result).toBe(expected);
    });

    it('should return empty string for undefined rtspUrl', () => {
      const customBaseUrl = 'https://custom-stream.example.com';
      const result = buildStreamUrl(undefined, customBaseUrl);

      expect(result).toBe('');
    });

    it('should handle empty string as rtspUrl', () => {
      const result = buildStreamUrl('');

      expect(result).toBe('');
    });
  });
});
