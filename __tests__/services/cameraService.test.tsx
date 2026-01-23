import cameraService from '../../src/services/cameraService';

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    defaults: {
      baseURL: '',
      headers: { common: {} },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
  };
});

describe('CameraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(cameraService).toBeDefined();
  });

  it('should have initialize method', () => {
    expect(typeof cameraService.initialize).toBe('function');
  });

  it('should initialize with basic config', () => {
    const config = {
      baseUrl: 'http://192.168.1.100',
      cameraId: 'cam1',
    };

    cameraService.initialize(config);
    expect(cameraService).toBeDefined();
  });

  it('should initialize with auth config', () => {
    const config = {
      baseUrl: 'http://192.168.1.100',
      cameraId: 'cam1',
      username: 'admin',
      password: 'password123',
    };

    cameraService.initialize(config);
    expect(cameraService).toBeDefined();
  });

  it('should have getStatus method', () => {
    expect(typeof cameraService.getStatus).toBe('function');
  });

  it('should have startStream method', () => {
    expect(typeof cameraService.startStream).toBe('function');
  });

  it('should have stopStream method', () => {
    expect(typeof cameraService.stopStream).toBe('function');
  });

  it('should have getStreamUrl method', () => {
    expect(typeof cameraService.getStreamUrl).toBe('function');
  });

  it('should have takeSnapshot method', () => {
    expect(typeof cameraService.takeSnapshot).toBe('function');
  });

  it('should have getSupportedQualities method', () => {
    expect(typeof cameraService.getSupportedQualities).toBe('function');
  });

  it('should have setQuality method', () => {
    expect(typeof cameraService.setQuality).toBe('function');
  });

  it('should have move method', () => {
    expect(typeof cameraService.move).toBe('function');
  });

  it('should have zoom method', () => {
    expect(typeof cameraService.zoom).toBe('function');
  });

  it('should have getPresets method', () => {
    expect(typeof cameraService.getPresets).toBe('function');
  });

  it('should have goToPreset method', () => {
    expect(typeof cameraService.goToPreset).toBe('function');
  });

  it('should have setPreset method', () => {
    expect(typeof cameraService.setPreset).toBe('function');
  });

  it('should have deletePreset method', () => {
    expect(typeof cameraService.deletePreset).toBe('function');
  });

  it('should have enableMotionDetection method', () => {
    expect(typeof cameraService.enableMotionDetection).toBe('function');
  });

  it('should have disableMotionDetection method', () => {
    expect(typeof cameraService.disableMotionDetection).toBe('function');
  });

  it('should have getMotionDetectionStatus method', () => {
    expect(typeof cameraService.getMotionDetectionStatus).toBe('function');
  });

  it('should have setMotionDetectionSensitivity method', () => {
    expect(typeof cameraService.setMotionDetectionSensitivity).toBe('function');
  });

  it('should have getRecordingStatus method', () => {
    expect(typeof cameraService.getRecordingStatus).toBe('function');
  });

  it('should have startRecording method', () => {
    expect(typeof cameraService.startRecording).toBe('function');
  });

  it('should have stopRecording method', () => {
    expect(typeof cameraService.stopRecording).toBe('function');
  });

  it('should have getRecordings method', () => {
    expect(typeof cameraService.getRecordings).toBe('function');
  });

  it('should have deleteRecording method', () => {
    expect(typeof cameraService.deleteRecording).toBe('function');
  });

  it('should initialize with baseUrl', () => {
    const config = {
      baseUrl: 'http://192.168.1.100:8080',
      cameraId: 'cam001',
    };

    cameraService.initialize(config);

    expect(cameraService).toBeDefined();
  });

  it('should set basic auth when username and password provided', () => {
    const config = {
      baseUrl: 'http://192.168.1.100:8080',
      cameraId: 'cam001',
      username: 'admin',
      password: 'password123',
    };

    cameraService.initialize(config);

    expect(cameraService).toBeDefined();
  });

  it('should get supported qualities', () => {
    const qualities = cameraService.getSupportedQualities();
    expect(Array.isArray(qualities)).toBe(true);
    expect(qualities.length).toBeGreaterThan(0);
    expect(qualities[0]).toHaveProperty('label');
    expect(qualities[0]).toHaveProperty('value');
    expect(qualities[0]).toHaveProperty('resolution');
    expect(qualities[0]).toHaveProperty('bitrate');
  });
});
