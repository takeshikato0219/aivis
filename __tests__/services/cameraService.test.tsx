import cameraService, {
  CameraConfig,
  StreamQuality,
  CameraStatus,
  Preset,
  Recording,
} from '../../src/services/cameraService';

describe('CameraService', () => {
  const mockConfig: CameraConfig = {
    baseUrl: 'http://192.168.1.100:8080',
    cameraId: 'cam001',
    username: 'admin',
    password: 'password123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service config before each test
    (cameraService as any).config = null;
  });

  describe('initialize', () => {
    it('should initialize with basic config', () => {
      const basicConfig: CameraConfig = {
        baseUrl: 'http://192.168.1.100',
        cameraId: 'cam1',
      };

      cameraService.initialize(basicConfig);

      expect((cameraService as any).config).toEqual(basicConfig);
    });

    it('should initialize with auth config', () => {
      cameraService.initialize(mockConfig);

      expect((cameraService as any).config).toEqual(mockConfig);
    });

    it('should initialize without auth when username/password not provided', () => {
      const configWithoutAuth: CameraConfig = {
        baseUrl: 'http://192.168.1.100',
        cameraId: 'cam1',
      };

      cameraService.initialize(configWithoutAuth);

      expect((cameraService as any).config).toEqual(configWithoutAuth);
    });
  });

  describe('getStreamUrl', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call getStreamUrl method when initialized', async () => {
      // Mock the axios get method
      const mockGet = jest.fn().mockResolvedValue({ data: { streamUrl: 'rtsp://test' } });
      (cameraService as any).axiosInstance.get = mockGet;

      await cameraService.getStreamUrl();

      expect(mockGet).toHaveBeenCalledWith('/api/stream', {
        params: {
          cameraId: mockConfig.cameraId,
          quality: 'medium',
        },
      });
    });

    it('should handle API errors', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('API Error'));
      (cameraService as any).axiosInstance.get = mockGet;

      await expect(cameraService.getStreamUrl()).rejects.toThrow('API Error');
    });
  });

  describe('getCameraStatus', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call getCameraStatus method when initialized', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { isOnline: true, bitrate: 1024, fps: 30, resolution: '1920x1080' } });
      (cameraService as any).axiosInstance.get = mockGet;

      await cameraService.getCameraStatus();

      expect(mockGet).toHaveBeenCalledWith('/api/camera/status', {
        params: { cameraId: mockConfig.cameraId },
      });
    });
  });

  describe('getStatus (alias)', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call getCameraStatus', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { isOnline: true, bitrate: 1024, fps: 30, resolution: '1920x1080' } });
      (cameraService as any).axiosInstance.get = mockGet;

      await cameraService.getStatus();

      expect(mockGet).toHaveBeenCalledWith('/api/camera/status', {
        params: { cameraId: mockConfig.cameraId },
      });
    });
  });

  describe('changeResolution', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call changeResolution method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.changeResolution('high');

      expect(mockPost).toHaveBeenCalledWith('/api/camera/resolution', {
        cameraId: mockConfig.cameraId,
        quality: 'high',
      });
    });
  });

  describe('startStream', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call startStream method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.startStream();

      expect(mockPost).toHaveBeenCalledWith('/api/stream/start', {
        cameraId: mockConfig.cameraId,
      });
    });
  });

  describe('stopStream', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call stopStream method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.stopStream();

      expect(mockPost).toHaveBeenCalledWith('/api/stream/stop', {
        cameraId: mockConfig.cameraId,
      });
    });
  });

  describe('takeSnapshot', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call takeSnapshot method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { imageUrl: 'test.jpg' } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.takeSnapshot();

      expect(mockPost).toHaveBeenCalledWith('/api/snapshot/take', {
        cameraId: mockConfig.cameraId,
      });
    });
  });

  describe('saveSnapshot', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call saveSnapshot method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { imageUrl: 'saved.jpg' } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.saveSnapshot('base64data');

      expect(mockPost).toHaveBeenCalledWith('/api/snapshot/save', {
        cameraId: mockConfig.cameraId,
        image: 'base64data',
        timestamp: expect.any(String),
      });
    });
  });

  describe('setQuality', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call setQuality method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.setQuality('hd');

      expect(mockPost).toHaveBeenCalledWith('/api/camera/quality', {
        cameraId: mockConfig.cameraId,
        quality: 'hd',
      });
    });
  });

  describe('move', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call move method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.move('up', 2);

      expect(mockPost).toHaveBeenCalledWith('/api/camera/move', {
        cameraId: mockConfig.cameraId,
        direction: 'up',
        speed: 2,
      });
    });

    it('should move with default speed', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.move('left');

      expect(mockPost).toHaveBeenCalledWith('/api/camera/move', {
        cameraId: mockConfig.cameraId,
        direction: 'left',
        speed: 1,
      });
    });
  });

  describe('zoom', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call zoom method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.zoom('in', 3);

      expect(mockPost).toHaveBeenCalledWith('/api/camera/zoom', {
        cameraId: mockConfig.cameraId,
        action: 'in',
        speed: 3,
      });
    });

    it('should zoom with default speed', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.zoom('out');

      expect(mockPost).toHaveBeenCalledWith('/api/camera/zoom', {
        cameraId: mockConfig.cameraId,
        action: 'out',
        speed: 1,
      });
    });
  });

  describe('getSupportedQualities', () => {
    it('should return predefined quality options', () => {
      const qualities = cameraService.getSupportedQualities();

      expect(Array.isArray(qualities)).toBe(true);
      expect(qualities).toHaveLength(4);

      expect(qualities[0]).toEqual({
        label: 'Low',
        value: 'low',
        resolution: '640x480',
        bitrate: 512,
      });

      expect(qualities[1]).toEqual({
        label: 'Medium',
        value: 'medium',
        resolution: '1280x720',
        bitrate: 1024,
      });

      expect(qualities[2]).toEqual({
        label: 'High',
        value: 'high',
        resolution: '1920x1080',
        bitrate: 2048,
      });

      expect(qualities[3]).toEqual({
        label: 'HD',
        value: 'hd',
        resolution: '3840x2160',
        bitrate: 4096,
      });
    });
  });

  describe('getPresets', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call getPresets method when initialized', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { presets: [] } });
      (cameraService as any).axiosInstance.get = mockGet;

      await cameraService.getPresets();

      expect(mockGet).toHaveBeenCalledWith('/api/camera/presets', {
        params: { cameraId: mockConfig.cameraId },
      });
    });
  });

  describe('goToPreset', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call goToPreset method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.goToPreset('preset1');

      expect(mockPost).toHaveBeenCalledWith('/api/camera/preset/go', {
        cameraId: mockConfig.cameraId,
        presetId: 'preset1',
      });
    });
  });

  describe('setPreset', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call setPreset method when initialized', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { presetId: 'preset123' } });
      (cameraService as any).axiosInstance.post = mockPost;

      await cameraService.setPreset('New Preset');

      expect(mockPost).toHaveBeenCalledWith('/api/camera/preset/set', {
        cameraId: mockConfig.cameraId,
        name: 'New Preset',
      });
    });
  });

  describe('deletePreset', () => {
    beforeEach(() => {
      cameraService.initialize(mockConfig);
    });

    it('should call deletePreset method when initialized', async () => {
      const mockDelete = jest.fn().mockResolvedValue({ data: { success: true } });
      (cameraService as any).axiosInstance.delete = mockDelete;

      await cameraService.deletePreset('preset1');

      expect(mockDelete).toHaveBeenCalledWith('/api/camera/preset', {
        data: {
          cameraId: mockConfig.cameraId,
          presetId: 'preset1',
        },
      });
    });
  });

  // Basic method existence and functionality tests
  describe('Service methods', () => {
    it('should have all expected methods', () => {
      expect(typeof cameraService.initialize).toBe('function');
      expect(typeof cameraService.getStreamUrl).toBe('function');
      expect(typeof cameraService.getCameraStatus).toBe('function');
      expect(typeof cameraService.getStatus).toBe('function');
      expect(typeof cameraService.startStream).toBe('function');
      expect(typeof cameraService.stopStream).toBe('function');
      expect(typeof cameraService.takeSnapshot).toBe('function');
      expect(typeof cameraService.getSupportedQualities).toBe('function');
      expect(typeof cameraService.move).toBe('function');
      expect(typeof cameraService.zoom).toBe('function');
      expect(typeof cameraService.getPresets).toBe('function');
      expect(typeof cameraService.enableMotionDetection).toBe('function');
      expect(typeof cameraService.disableMotionDetection).toBe('function');
      expect(typeof cameraService.startRecording).toBe('function');
      expect(typeof cameraService.stopRecording).toBe('function');
      expect(typeof cameraService.getRecordings).toBe('function');
    });

    it('should initialize and be ready to use', () => {
      cameraService.initialize(mockConfig);
      expect((cameraService as any).config).toBeDefined();
      expect((cameraService as any).config.cameraId).toBe(mockConfig.cameraId);
    });
  });
});
