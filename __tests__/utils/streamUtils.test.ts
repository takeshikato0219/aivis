import { buildStreamUrl, getStreamHTML } from '../../src/utils/streamUtils';

describe('streamUtils', () => {
  const mockBaseUrl = 'https://avisaitest-nginx001.wpstories.org';

  describe('buildStreamUrl', () => {
    it('should return default stream URL when no rtspUrl is provided', () => {
      const result = buildStreamUrl();
      const expected = `${mockBaseUrl}/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg`;

      expect(result).toBe(expected);
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

    it('should wrap RTSP URL with base URL and encode it', () => {
      const rtspUrl = 'rtsp://192.168.1.100:554/live';
      const result = buildStreamUrl(rtspUrl);
      const expected = `${mockBaseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg`;

      expect(result).toBe(expected);
    });

    it('should handle RTSP URLs with special characters', () => {
      const rtspUrl = 'rtsp://user:pass@192.168.1.100:554/live?param=value&other=test';
      const result = buildStreamUrl(rtspUrl);
      const expected = `${mockBaseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg`;

      expect(result).toBe(expected);
    });

    it('should use custom base URL when provided', () => {
      const customBaseUrl = 'https://custom-stream.example.com';
      const rtspUrl = 'rtsp://camera.local/live';
      const result = buildStreamUrl(rtspUrl, customBaseUrl);
      const expected = `${customBaseUrl}/stream.html?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse,hls,mjpeg`;

      expect(result).toBe(expected);
    });

    it('should use custom base URL for default stream when no rtspUrl provided', () => {
      const customBaseUrl = 'https://custom-stream.example.com';
      const result = buildStreamUrl(undefined, customBaseUrl);
      const expected = `${customBaseUrl}/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg`;

      expect(result).toBe(expected);
    });

    it('should handle empty string as rtspUrl', () => {
      const result = buildStreamUrl('');
      const expected = `${mockBaseUrl}/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg`;

      expect(result).toBe(expected);
    });
  });

  describe('getStreamHTML', () => {
    const mockStreamUrl = 'https://example.com/stream.html?src=test';

    it('should return HTML string with stream URL in iframe', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(typeof result).toBe('string');
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain(`src="${mockStreamUrl}"`);
      expect(result).toContain('<iframe');
      expect(result).toContain('allow="camera; microphone; autoplay; fullscreen"');
      expect(result).toContain('allowfullscreen');
      expect(result).toContain('frameborder="0"');
    });

    it('should include proper HTML structure', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(result).toContain('<html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<body>');
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
      expect(result).toContain('<style>');
      expect(result).toContain('<script>');
    });

    it('should include CSS styles for fullscreen display', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(result).toContain('#stream-container');
      expect(result).toContain('width: 100%');
      expect(result).toContain('height: 100%');
      expect(result).toContain('background: #000');
      expect(result).toContain('object-fit: cover');
      expect(result).toContain('border: none');
    });

    it('should include error handling script', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(result).toContain("window.addEventListener('error'");
      expect(result).toContain('e.preventDefault()');
      expect(result).toContain("window.addEventListener('load'");
      expect(result).toContain('console.log(\'Stream iframe loaded\')');
    });

    it('should handle URLs with special characters', () => {
      const specialUrl = 'https://example.com/stream.html?src=test&param=value&other=test%20space';
      const result = getStreamHTML(specialUrl);

      expect(result).toContain(`src="${specialUrl}"`);
    });

    it('should include Content Security Policy meta tag', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(result).toContain('Content-Security-Policy');
      expect(result).toContain('upgrade-insecure-requests');
    });

    it('should have proper iframe container structure', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(result).toContain('<div id="stream-container">');
      expect(result).toContain('<iframe');
      expect(result).toContain('</iframe>');
      expect(result).toContain('</div>');
    });

    it('should include proper viewport meta tag for mobile', () => {
      const result = getStreamHTML(mockStreamUrl);

      expect(result).toContain('width=device-width');
      expect(result).toContain('initial-scale=1.0');
      expect(result).toContain('maximum-scale=1.0');
      expect(result).toContain('user-scalable=no');
    });
  });
});