// Mock dependencies BEFORE import
jest.mock('react-native-record-screen', () => ({
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  clean: jest.fn(),
}));
jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    save: jest.fn(),
  },
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 32 },
  PermissionsAndroid: {
    request: jest.fn(),
    PERMISSIONS: { WRITE_EXTERNAL_STORAGE: 'WRITE_EXTERNAL_STORAGE' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
  },
}));

import RecordingService from '../../src/services/recordingService';
import RecordScreen from 'react-native-record-screen';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { PermissionsAndroid } from 'react-native';

describe('RecordingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (RecordingService.getIsRecording()) {
      (RecordScreen.stopRecording as jest.Mock).mockResolvedValue({
        status: 'success',
        result: { outputURL: '/mock/path.mp4' },
      });
      try {
        RecordingService.stopRecording();
      } catch {} // ignore error
    }
  });

  describe('startRecording', () => {
    it('should start recording successfully', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      expect(RecordScreen.startRecording).toHaveBeenCalledWith({ mic: false });
      expect(RecordingService.getIsRecording()).toBe(true);
    });

    it('should throw error if already recording', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      await expect(RecordingService.startRecording()).rejects.toThrow('Already recording');
      // Đảm bảo stopRecording luôn được mock
      (RecordScreen.stopRecording as jest.Mock).mockResolvedValue({
        status: 'success',
        result: { outputURL: '/mock/path.mp4' },
      });
      await RecordingService.stopRecording();
    });

    it('should throw error if permission denied', async () => {
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('denied');
      await expect(RecordingService.startRecording()).rejects.toThrow('Storage permission denied');
    });

    it('should throw error if startRecording fails', async () => {
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      (RecordScreen.startRecording as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(RecordingService.startRecording()).rejects.toThrow('fail');
      expect(RecordingService.getIsRecording()).toBe(false);
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and return file path', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      const mockResult = { status: 'success', result: { outputURL: '/mock/path.mp4' } };
      (RecordScreen.stopRecording as jest.Mock).mockResolvedValue(mockResult);
      const filePath = await RecordingService.stopRecording();
      expect(filePath).toBe('/mock/path.mp4');
      expect(RecordingService.getIsRecording()).toBe(false);
    });

    it('should throw error if not recording', async () => {
      // Không mock stopRecording, vì sẽ ném lỗi trước khi gọi
      await expect(RecordingService.stopRecording()).rejects.toThrow('Not recording');
    });

    it('should throw error if stopRecording fails', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      (RecordScreen.stopRecording as jest.Mock).mockRejectedValue(new Error('fail stop'));
      await expect(RecordingService.stopRecording()).rejects.toThrow('fail stop');
      expect(RecordingService.getIsRecording()).toBe(false);
    });

    it('should throw error if response is not success', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      // Mock response trả về object có status khác 'success'
      (RecordScreen.stopRecording as jest.Mock).mockResolvedValue({
        status: 'error',
        result: { outputURL: '' },
      });
      await expect(RecordingService.stopRecording()).rejects.toThrow(
        'Recording failed - no output file'
      );
    });
  });

  describe('saveToGallery', () => {
    it('should save video to gallery successfully', async () => {
      (CameraRoll.save as jest.Mock).mockResolvedValue('/mock/gallery.mp4');
      const uri = await RecordingService.saveToGallery('/mock/path.mp4');
      expect(uri).toBe('/mock/gallery.mp4');
      expect(CameraRoll.save).toHaveBeenCalledWith('/mock/path.mp4', { type: 'video' });
    });

    it('should throw error if save fails', async () => {
      (CameraRoll.save as jest.Mock).mockRejectedValue(new Error('save fail'));
      await expect(RecordingService.saveToGallery('/mock/path.mp4')).rejects.toThrow('save fail');
    });
  });

  describe('getStatus', () => {
    it('should return correct status', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      const status = RecordingService.getStatus();
      expect(status.isRecording).toBe(true);
      expect(status.startTime).toBeInstanceOf(Date);
    });
  });

  describe('getRecordingDuration', () => {
    it('should return correct duration', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      // Giả lập startTime là 5 giây trước
      const oldStatus = RecordingService.getStatus();
      const fakeStart = new Date(Date.now() - 5000);
      // @ts-ignore: hack test
      oldStatus.startTime = fakeStart;
      // @ts-ignore: hack test
      RecordingService.startTime = fakeStart;
      expect(RecordingService.getRecordingDuration()).toBe(5);
    });
    it('should return 0 if not started', () => {
      // Reset startTime về null
      // @ts-ignore
      RecordingService.startTime = null;
      expect(RecordingService.getRecordingDuration()).toBe(0);
    });
  });

  describe('getIsRecording', () => {
    it('should return correct recording state', async () => {
      (RecordScreen.startRecording as jest.Mock).mockResolvedValue('started');
      (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
      await RecordingService.startRecording();
      expect(RecordingService.getIsRecording()).toBe(true);
      (RecordScreen.stopRecording as jest.Mock).mockResolvedValue({
        status: 'success',
        result: { outputURL: '/mock/path.mp4' },
      });
      await RecordingService.stopRecording();
      expect(RecordingService.getIsRecording()).toBe(false);
    });
  });

  describe('cleanSandbox', () => {
    it('should clean sandbox successfully', async () => {
      (RecordScreen.clean as jest.Mock).mockResolvedValue(undefined);
      await RecordingService.cleanSandbox();
      expect(RecordScreen.clean).toHaveBeenCalled();
    });
    it('should handle error when cleaning fails', async () => {
      (RecordScreen.clean as jest.Mock).mockRejectedValue(new Error('clean fail'));
      await RecordingService.cleanSandbox(); // Should not throw
      expect(RecordScreen.clean).toHaveBeenCalled();
    });
  });
});
