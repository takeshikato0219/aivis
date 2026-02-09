import RecordScreen from 'react-native-record-screen';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Platform, PermissionsAndroid } from 'react-native';

interface RecordingSuccessResult {
  status: 'success';
  result: {
    outputURL: string;
  };
}

export interface RecordingStatus {
  isRecording: boolean;
  startTime: Date | null;
}

/**
 * Service for screen recording using react-native-record-screen.
 * Uses ReplayKit on iOS and HBRecorder on Android.
 */
class RecordingService {
  private isRecording = false;
  private startTime: Date | null = null;

  /**
   * Request necessary permissions for Android.
   */
  private async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs storage permission to save recordings',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }

  /**
   * Start screen recording.
   * On Android, this will show a system dialog asking for permission to record.
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    // Request permissions on Android
    if (Platform.OS === 'android') {
      const hasPermission = await this.requestAndroidPermissions();
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }
    }

    try {
      const result = await RecordScreen.startRecording({
        mic: false, // Don't record microphone audio
      });

      if (result === 'started') {
        this.isRecording = true;
        this.startTime = new Date();
        console.log('Screen recording started');
      } else {
        throw new Error('Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting screen recording:', error);
      this.isRecording = false;
      this.startTime = null;
      throw error;
    }
  }

  /**
   * Stop screen recording and return the video file path.
   */
  async stopRecording(): Promise<string> {
    if (!this.isRecording) {
      throw new Error('Not recording');
    }

    try {
      const response = await RecordScreen.stopRecording();
      this.isRecording = false;

      // Check if response is successful
      if (response.status === 'success') {
        const successResponse = response as RecordingSuccessResult;
        console.log('Screen recording stopped, file:', successResponse.result.outputURL);
        return successResponse.result.outputURL;
      }

      throw new Error('Recording failed - no output file');
    } catch (error) {
      console.error('Error stopping screen recording:', error);
      this.isRecording = false;
      this.startTime = null;
      throw error;
    }
  }

  /**
   * Save a recorded video to the device's gallery/camera roll.
   */
  async saveToGallery(filePath: string): Promise<string> {
    try {
      const savedUri = await CameraRoll.save(filePath, { type: 'video' });
      console.log('Video saved to gallery:', savedUri);
      return savedUri;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      throw error;
    }
  }

  /**
   * Get the current recording status.
   */
  getStatus(): RecordingStatus {
    return {
      isRecording: this.isRecording,
      startTime: this.startTime,
    };
  }

  /**
   * Get the recording duration in seconds.
   */
  getRecordingDuration(): number {
    if (!this.startTime) {
      return 0;
    }
    return Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
  }

  /**
   * Check if currently recording.
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Clean the sandbox/cache directory (useful for freeing up space).
   */
  async cleanSandbox(): Promise<void> {
    try {
      await RecordScreen.clean();
      console.log('Recording sandbox cleaned');
    } catch (error) {
      console.error('Error cleaning sandbox:', error);
    }
  }
}

export default new RecordingService();
