import {
  buildStreamUrl,
  buildStreamHtmlUrl,
  getQueryParamFromUrl,
  getRawTokenValueFromUrl,
  decodeStreamTokenFromUrlValue,
  buildStreamHtmlUrlForAndroid,
  buildHlsStreamUrlFromWs,
  getStreamOriginBaseUrl,
  getInjectedStreamPlayerJS,
  buildIOSStreamInlineHtml,
} from '../../src/utils/streamUtils';

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
      const expected = `${mockBaseUrl}/stream.html?src=camera&mode=mse,hls&autoplay=true`;

      expect(result).toBe(expected);
    });

    it('should extract domain from ws:// URL and build stream.html URL with http', () => {
      const wsUrl = 'ws://localhost:8554/api/ws?src=mycam&token=xyz';
      const result = buildStreamHtmlUrl(wsUrl);

      expect(result).toBe('http://localhost:8554/stream.html?src=mycam&mode=mse,hls&autoplay=true');
    });

    it('should default src to "camera" when src param is missing', () => {
      const wsUrl = 'wss://example.com/api/ws?token=abc';
      const result = buildStreamHtmlUrl(wsUrl);

      expect(result).toBe('https://example.com/stream.html?src=camera&mode=mse,hls&autoplay=true');
    });

    it('should encode special characters in src param', () => {
      const wsUrl = 'wss://example.com/api/ws?src=camera/stream1&token=abc';
      const result = buildStreamHtmlUrl(wsUrl);

      expect(result).toBe(
        `https://example.com/stream.html?src=${encodeURIComponent('camera/stream1')}&mode=mse,hls&autoplay=true`
      );
    });

    it('should return empty string for invalid URL', () => {
      const result = buildStreamHtmlUrl('not-a-valid-url');

      expect(result).toBe('');
    });
  });

  describe('getQueryParamFromUrl', () => {
    it('should return the correct value for a present key', () => {
      const url = 'wss://host/api/ws?src=camera&token=abc123';
      expect(getQueryParamFromUrl(url, 'src')).toBe('camera');
      expect(getQueryParamFromUrl(url, 'token')).toBe('abc123');
    });
    it('should decode URL-encoded values', () => {
      const url = 'wss://host/api/ws?src=camera%2Fmain&token=abc%2B123%3D%3D';
      expect(getQueryParamFromUrl(url, 'src')).toBe('camera/main');
      expect(getQueryParamFromUrl(url, 'token')).toBe('abc+123==');
    });
    it('should return null for missing key', () => {
      const url = 'wss://host/api/ws?src=camera';
      expect(getQueryParamFromUrl(url, 'token')).toBeNull();
    });
    it('should return null for missing query', () => {
      expect(getQueryParamFromUrl('wss://host/api/ws', 'src')).toBeNull();
    });
    it('should return null for empty input', () => {
      expect(getQueryParamFromUrl('', 'src')).toBeNull();
      expect(getQueryParamFromUrl('wss://host/api/ws?src=camera', '')).toBeNull();
    });
  });

  describe('getRawTokenValueFromUrl', () => {
    it('should extract the raw token value', () => {
      const url = 'wss://host/api/ws?src=camera&token=abc123==&other=1';
      expect(getRawTokenValueFromUrl(url)).toBe('abc123==');
    });
    it('should return null if token is missing', () => {
      const url = 'wss://host/api/ws?src=camera';
      expect(getRawTokenValueFromUrl(url)).toBeNull();
    });
    it('should return null for empty input', () => {
      expect(getRawTokenValueFromUrl('')).toBeNull();
    });
  });

  describe('decodeStreamTokenFromUrlValue', () => {
    it('should decode plus and percent-encoded values', () => {
      expect(decodeStreamTokenFromUrlValue('abc%2B123%3D%3D')).toBe('abc+123==');
      expect(decodeStreamTokenFromUrlValue('abc+123')).toBe('abc 123');
    });
    it('should return raw value if decode fails', () => {
      // %E0%A4%A is incomplete percent encoding
      expect(decodeStreamTokenFromUrlValue('%E0%A4%A')).toBe('%E0%A4%A');
    });
  });

  describe('buildStreamHtmlUrlForAndroid', () => {
    it('should build correct URL with token', () => {
      const wsUrl = 'wss://host/api/ws?src=cam&token=tok123';
      expect(buildStreamHtmlUrlForAndroid(wsUrl)).toContain('src=cam');
      expect(buildStreamHtmlUrlForAndroid(wsUrl)).toContain('token=tok123');
      expect(buildStreamHtmlUrlForAndroid(wsUrl)).toContain('mode=webrtc,mse,hls,mjpeg');
    });
    it('should default src to camera', () => {
      const wsUrl = 'wss://host/api/ws?token=tok123';
      expect(buildStreamHtmlUrlForAndroid(wsUrl)).toContain('src=camera');
    });
    it('should return empty string for invalid URL', () => {
      expect(buildStreamHtmlUrlForAndroid('not-a-url')).toBe('');
    });
  });

  describe('buildHlsStreamUrlFromWs', () => {
    it('should build correct HLS URL with src and token', () => {
      const wsUrl = 'wss://host/api/ws?src=cam&token=tok123';
      expect(buildHlsStreamUrlFromWs(wsUrl)).toContain('/api/stream.m3u8?src=cam&token=tok123');
    });
    it('should default src to camera', () => {
      const wsUrl = 'wss://host/api/ws?token=tok123';
      expect(buildHlsStreamUrlFromWs(wsUrl)).toContain('src=camera');
    });
    it('should return empty string for invalid URL', () => {
      expect(buildHlsStreamUrlFromWs('not-a-url')).toBe('');
    });
  });

  describe('getStreamOriginBaseUrl', () => {
    it('should extract protocol and host', () => {
      const wsUrl = 'wss://host:1234/api/ws?src=cam';
      expect(getStreamOriginBaseUrl(wsUrl)).toBe('https://host:1234');
    });
    it('should return empty string for invalid URL', () => {
      expect(getStreamOriginBaseUrl('not-a-url')).toBe('');
    });
  });

  describe('getInjectedStreamPlayerJS', () => {
    it('should return a string containing jsReady and WebSocket', () => {
      const js = getInjectedStreamPlayerJS('ios');
      expect(js).toContain('jsReady');
      expect(js).toContain('WebSocket');
      expect(js).toContain('window.ReactNativeWebView');
    });
    it('should include isIOS check for ios', () => {
      const js = getInjectedStreamPlayerJS('ios');
      expect(js).toContain('var isIOS = true');
    });
    it('should include isIOS check for android', () => {
      const js = getInjectedStreamPlayerJS('android');
      expect(js).toContain('var isIOS = false');
    });
  });

  describe('buildIOSStreamInlineHtml', () => {
    it('should return html and baseUrl', () => {
      const wsUrl = 'wss://host/api/ws?src=cam&token=tok123';
      const { html, baseUrl } = buildIOSStreamInlineHtml(wsUrl);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('video');
      expect(baseUrl).toBe('https://host');
    });
    it('should return empty html and baseUrl for invalid url', () => {
      const { html, baseUrl } = buildIOSStreamInlineHtml('not-a-url');
      expect(html).toBe('');
      expect(baseUrl).toBe('');
    });
  });
});
