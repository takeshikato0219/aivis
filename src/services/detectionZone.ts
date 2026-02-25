import axiosInstance from '../api/axiosConfig';
import { API_BASE_URL, API_ENDPOINTS } from '@api/apiEndpoints';

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

export interface DetectionZoneResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    camera_id: string;
    coordinates: Array<{ x: number; y: number }>;
    created_at: string;
    updated_at: string;
  }>;
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    is_truncated: boolean | null;
  };
}

class DetectionZoneService {
  private axiosInstance = axiosInstance.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  /**
   * Get all detection zones for a camera with sorting, pagination, and authorization
   */
  async getZones(
    cameraId: string,
    options?: {
      sort_by?: string;
      sort_order?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<DetectionZoneResponse> {
    try {
      const { sort_by, sort_order, page, per_page } = options || {};
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.CAMERAS}/${cameraId}/detection-zones`,
        {
          params: {
            ...(sort_by && { sort_by }),
            ...(sort_order && { sort_order }),
            ...(page && { page }),
            ...(per_page && { per_page }),
          },
        }
      );
      return response.data;
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
      coordinates: Array<{ x: number; y: number }>;
    }
  ): Promise<any> {
    try {
      const response = await axiosInstance.post(
        `${API_ENDPOINTS.CAMERAS}/${cameraId}/detection-zones`,
        zoneData
      );
      return response.data;
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
      const response = await axiosInstance.put(
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
      const response = await axiosInstance.delete(`/cameras/${cameraId}/detection-zones/${zoneId}`);
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
      const response = await axiosInstance.post(
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
      const response = await axiosInstance.post(
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
      const response = await axiosInstance.get(
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
      const response = await axiosInstance.post(
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
      const response = await axiosInstance.get(
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
