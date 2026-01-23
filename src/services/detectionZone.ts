import axios from 'axios';
import { API_BASE_URL } from '@api/apiEndpoints';

export interface DetectionZoneCoordinates {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}

export interface DetectionZone {
  id: string;
  cameraId: string;
  name: string;
  coordinates: DetectionZoneCoordinates;
  enabled: boolean;
  sensitivity: number;
  createdAt: string;
  updatedAt: string;
}

class DetectionZoneService {
  private axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  /**
   * Get all detection zones for a camera
   */
  async getZones(cameraId: string): Promise<DetectionZone[]> {
    try {
      const response = await this.axiosInstance.get(`/cameras/${cameraId}/detection-zones`);
      return response.data.zones;
    } catch (error) {
      console.error('Error getting detection zones:', error);
      throw error;
    }
  }

  /**
   * Create a new detection zone
   */
  async createZone(
    cameraId: string,
    zoneData: {
      name: string;
      coordinates: DetectionZoneCoordinates;
      sensitivity?: number;
    }
  ): Promise<DetectionZone> {
    try {
      const response = await this.axiosInstance.post(
        `/cameras/${cameraId}/detection-zones`,
        zoneData
      );
      return response.data.zone;
    } catch (error) {
      console.error('Error creating detection zone:', error);
      throw error;
    }
  }

  /**
   * Update an existing detection zone
   */
  async updateZone(
    cameraId: string,
    zoneId: string,
    zoneData: Partial<{
      name: string;
      coordinates: DetectionZoneCoordinates;
      enabled: boolean;
      sensitivity: number;
    }>
  ): Promise<DetectionZone> {
    try {
      const response = await this.axiosInstance.put(
        `/cameras/${cameraId}/detection-zones/${zoneId}`,
        zoneData
      );
      return response.data.zone;
    } catch (error) {
      console.error('Error updating detection zone:', error);
      throw error;
    }
  }

  /**
   * Delete a detection zone
   */
  async deleteZone(cameraId: string, zoneId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete(
        `/cameras/${cameraId}/detection-zones/${zoneId}`
      );
      return response.data.success;
    } catch (error) {
      console.error('Error deleting detection zone:', error);
      throw error;
    }
  }

  /**
   * Enable a detection zone
   */
  async enableZone(cameraId: string, zoneId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post(
        `/cameras/${cameraId}/detection-zones/${zoneId}/enable`
      );
      return response.data.success;
    } catch (error) {
      console.error('Error enabling detection zone:', error);
      throw error;
    }
  }

  /**
   * Disable a detection zone
   */
  async disableZone(cameraId: string, zoneId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post(
        `/cameras/${cameraId}/detection-zones/${zoneId}/disable`
      );
      return response.data.success;
    } catch (error) {
      console.error('Error disabling detection zone:', error);
      throw error;
    }
  }

  /**
   * Get status of a detection zone
   */
  async getZoneStatus(
    cameraId: string,
    zoneId: string
  ): Promise<{ enabled: boolean; sensitivity: number }> {
    try {
      const response = await this.axiosInstance.get(
        `/cameras/${cameraId}/detection-zones/${zoneId}/status`
      );
      return response.data.status;
    } catch (error) {
      console.error('Error getting zone status:', error);
      throw error;
    }
  }

  /**
   * Set sensitivity for a detection zone
   */
  async setZoneSensitivity(
    cameraId: string,
    zoneId: string,
    sensitivity: number
  ): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post(
        `/cameras/${cameraId}/detection-zones/${zoneId}/sensitivity`,
        {
          sensitivity,
        }
      );
      return response.data.success;
    } catch (error) {
      console.error('Error setting zone sensitivity:', error);
      throw error;
    }
  }

  /**
   * Get detection history for a zone
   */
  async getZoneHistory(cameraId: string, zoneId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(
        `/cameras/${cameraId}/detection-zones/${zoneId}/history`,
        {
          params: { limit },
        }
      );
      return response.data.history;
    } catch (error) {
      console.error('Error getting zone history:', error);
      throw error;
    }
  }
}

const detectionZoneService = new DetectionZoneService();

export default detectionZoneService;

// Legacy function for backward compatibility
export const saveDetectionZone = async (cameraId: string, zone: DetectionZoneCoordinates) => {
  try {
    const token = '';
    const response = await fetch(`${API_BASE_URL}/cameras/${cameraId}/detection-zone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cameraId,
        coordinates: zone,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save detection zone');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving detection zone:', error);
    throw error;
  }
};
