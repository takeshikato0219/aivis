import { buildStreamUrl, buildStreamHtmlUrl } from '../../src/utils/streamUtils';

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

    it('should return empty string for RTSP URL', () => {
      const rtspUrl = 'rtsp://192.168.1.100:554/live';
      const result = buildStreamUrl(rtspUrl);

      expect(result).toBe('');
    });

    it('should return empty string for undefined rtspUrl', () => {
      const result = buildStreamUrl(undefined);

      expect(result).toBe('');
    });

    it('should handle empty string as rtspUrl', () => {
      const result = buildStreamUrl('');

      expect(result).toBe('');
    });
  });

  describe('buildStreamHtmlUrl', () => {
    it('should return empty string when no URL is provided', () => {
      expect(buildStreamHtmlUrl()).toBe('');
      expect(buildStreamHtmlUrl('')).toBe('');
    });

    it('should extract domain from wss:// URL and build stream.html URL', () => {
      const wsUrl = `wss://avisaitest-nginx001.wpstories.org/api/ws?src=camera&token=abc123`;
      const result = buildStreamHtmlUrl(wsUrl);
      const expected = `${mockBaseUrl}/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg&autoplay=true`;

      expect(result).toBe(expected);
    });

    it('should extract domain from ws:// URL and build stream.html URL with http', () => {
      const wsUrl = 'ws://localhost:8554/api/ws?src=mycam&token=xyz';
      const result = buildStreamHtmlUrl(wsUrl);

      expect(result).toBe('http://localhost:8554/stream.html?src=mycam&mode=webrtc,mse,hls,mjpeg&autoplay=true');
    });

    it('should default src to "camera" when src param is missing', () => {
      const wsUrl = 'wss://example.com/api/ws?token=abc';
      const result = buildStreamHtmlUrl(wsUrl);

      expect(result).toBe('https://example.com/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg&autoplay=true');
    });

    it('should encode special characters in src param', () => {
      const wsUrl = 'wss://example.com/api/ws?src=camera/stream1&token=abc';
      const result = buildStreamHtmlUrl(wsUrl);

      expect(result).toBe(`https://example.com/stream.html?src=${encodeURIComponent('camera/stream1')}&mode=webrtc,mse,hls,mjpeg&autoplay=true`);
    });

    it('should return empty string for invalid URL', () => {
      const result = buildStreamHtmlUrl('not-a-valid-url');

      expect(result).toBe('');
    });
  });
});
