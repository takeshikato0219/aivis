import axios, { AxiosInstance } from 'axios';

export interface CameraConfig {
  baseUrl: string;
  cameraId: string;
  username?: string;
  password?: string;
}

export interface StreamQuality {
  label: string;
  value: 'low' | 'medium' | 'high' | 'hd';
  resolution: string;
  bitrate: number;
}

export interface CameraStatus {
  isOnline: boolean;
  bitrate: number;
  fps: number;
  resolution: string;
}

export interface Preset {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface Recording {
  id: string;
  timestamp: string;
  duration: number;
  size: number;
}

class CameraService {
  private axiosInstance: AxiosInstance;
  private config: CameraConfig | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Establish a connection with the camera.
   */
  initialize(config: CameraConfig) {
    this.config = config;
    this.axiosInstance.defaults.baseURL = config.baseUrl;

    if (config.username && config.password) {
      const token = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.axiosInstance.defaults.headers.common.Authorization = `Basic ${token}`;
    }
  }

  /**
   * Get stream URL from camera
   */
  async getStreamUrl(quality: StreamQuality['value'] = 'medium'): Promise<string> {
    try {
      const response = await this.axiosInstance.get('/api/stream', {
        params: {
          cameraId: this.config?.cameraId,
          quality,
        },
      });
      return response.data.streamUrl;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      throw error;
    }
  }

  /**
   * Retrieve camera status information.
   */
  async getCameraStatus(): Promise<CameraStatus> {
    try {
      const response = await this.axiosInstance.get('/api/camera/status', {
        params: {
          cameraId: this.config?.cameraId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting camera status:', error);
      throw error;
    }
  }

  /**
   * Change the camera resolution.
   */
  async changeResolution(quality: StreamQuality['value']): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/resolution', {
        cameraId: this.config?.cameraId,
        quality,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error changing resolution:', error);
      throw error;
    }
  }

  /**
   * Start sending audio from your phone to the camera.
   */
  async startAudioStream(audioStreamUrl: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/audio/start', {
        cameraId: this.config?.cameraId,
        audioStreamUrl,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error starting audio stream:', error);
      throw error;
    }
  }

  /**
   * Stop sending audio
   */
  async stopAudioStream(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/audio/stop', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error stopping audio stream:', error);
      throw error;
    }
  }

  /**
   * Save snapshots to the server.
   */
  async saveSnapshot(imageBase64: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/api/snapshot/save', {
        cameraId: this.config?.cameraId,
        image: imageBase64,
        timestamp: new Date().toISOString(),
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error saving snapshot:', error);
      throw error;
    }
  }

  /**
   * Get camera status (alias for getCameraStatus).
   */
  async getStatus(): Promise<CameraStatus> {
    return this.getCameraStatus();
  }

  /**
   * Start camera stream.
   */
  async startStream(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/stream/start', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  /**
   * Stop camera stream.
   */
  async stopStream(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/stream/stop', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error stopping stream:', error);
      throw error;
    }
  }

  /**
   * Take snapshot (alias for saveSnapshot).
   */
  async takeSnapshot(): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/api/snapshot/take', {
        cameraId: this.config?.cameraId,
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error taking snapshot:', error);
      throw error;
    }
  }

  /**
   * Get supported stream qualities.
   */
  getSupportedQualities(): StreamQuality[] {
    return [
      { label: 'Low', value: 'low', resolution: '640x480', bitrate: 512 },
      { label: 'Medium', value: 'medium', resolution: '1280x720', bitrate: 1024 },
      { label: 'High', value: 'high', resolution: '1920x1080', bitrate: 2048 },
      { label: 'HD', value: 'hd', resolution: '3840x2160', bitrate: 4096 },
    ];
  }

  /**
   * Set stream quality.
   */
  async setQuality(quality: StreamQuality['value']): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/quality', {
        cameraId: this.config?.cameraId,
        quality,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error setting quality:', error);
      throw error;
    }
  }

  /**
   * Move camera to position.
   */
  async move(direction: 'up' | 'down' | 'left' | 'right', speed: number = 1): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/move', {
        cameraId: this.config?.cameraId,
        direction,
        speed,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error moving camera:', error);
      throw error;
    }
  }

  /**
   * Zoom camera.
   */
  async zoom(action: 'in' | 'out', speed: number = 1): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/zoom', {
        cameraId: this.config?.cameraId,
        action,
        speed,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error zooming camera:', error);
      throw error;
    }
  }

  /**
   * Get camera presets.
   */
  async getPresets(): Promise<Preset[]> {
    try {
      const response = await this.axiosInstance.get('/api/camera/presets', {
        params: {
          cameraId: this.config?.cameraId,
        },
      });
      return response.data.presets;
    } catch (error) {
      console.error('Error getting presets:', error);
      throw error;
    }
  }

  /**
   * Go to preset position.
   */
  async goToPreset(presetId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/preset/go', {
        cameraId: this.config?.cameraId,
        presetId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error going to preset:', error);
      throw error;
    }
  }

  /**
   * Set camera preset.
   */
  async setPreset(name: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/api/camera/preset/set', {
        cameraId: this.config?.cameraId,
        name,
      });
      return response.data.presetId;
    } catch (error) {
      console.error('Error setting preset:', error);
      throw error;
    }
  }

  /**
   * Delete camera preset.
   */
  async deletePreset(presetId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete('/api/camera/preset', {
        data: {
          cameraId: this.config?.cameraId,
          presetId,
        },
      });
      return response.data.success;
    } catch (error) {
      console.error('Error deleting preset:', error);
      throw error;
    }
  }

  /**
   * Enable motion detection.
   */
  async enableMotionDetection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/motion/enable', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error enabling motion detection:', error);
      throw error;
    }
  }

  /**
   * Disable motion detection.
   */
  async disableMotionDetection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/motion/disable', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error disabling motion detection:', error);
      throw error;
    }
  }

  /**
   * Get motion detection status.
   */
  async getMotionDetectionStatus(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/api/camera/motion/status', {
        params: {
          cameraId: this.config?.cameraId,
        },
      });
      return response.data.enabled;
    } catch (error) {
      console.error('Error getting motion detection status:', error);
      throw error;
    }
  }

  /**
   * Set motion detection sensitivity.
   */
  async setMotionDetectionSensitivity(sensitivity: number): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/motion/sensitivity', {
        cameraId: this.config?.cameraId,
        sensitivity,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error setting motion detection sensitivity:', error);
      throw error;
    }
  }

  /**
   * Get recording status.
   */
  async getRecordingStatus(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/api/camera/recording/status', {
        params: {
          cameraId: this.config?.cameraId,
        },
      });
      return response.data.isRecording;
    } catch (error) {
      console.error('Error getting recording status:', error);
      throw error;
    }
  }

  /**
   * Start recording.
   */
  async startRecording(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/recording/start', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording.
   */
  async stopRecording(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/camera/recording/stop', {
        cameraId: this.config?.cameraId,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Get recordings list.
   */
  async getRecordings(): Promise<Recording[]> {
    try {
      const response = await this.axiosInstance.get('/api/camera/recordings', {
        params: {
          cameraId: this.config?.cameraId,
        },
      });
      return response.data.recordings;
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw error;
    }
  }

  /**
   * Delete recording.
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete('/api/camera/recording', {
        data: {
          cameraId: this.config?.cameraId,
          recordingId,
        },
      });
      return response.data.success;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }
}

export default new CameraService();
