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
    in_direction_point?: { x: number; y: number };
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

export interface ZoneType {
  id: string;
  code: string;
  name: string;
  name_ja: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  name_trans: string;
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
    zone_type_id: string,
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
            zone_type_id,
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
      zone_type_id: string;
      coordinates: Array<{ x: number; y: number }>;
      in_direction_point?: { x: number; y: number };
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

  async updateZone(
    zoneId: string,
    cameraId: string,
    zoneData: {
      zone_type_id: string;
      coordinates: Array<{ x: number; y: number }>;
      in_direction_point?: { x: number; y: number };
    }
  ): Promise<any> {
    try {
      const response = await axiosInstance.patch(
        `${API_ENDPOINTS.CAMERAS}/${cameraId}/detection-zones/${zoneId}`,
        zoneData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating detection zone:', error);
      throw error;
    }
  }

  /**
   * Get zone types
   */
  async getType(): Promise<{ success: boolean; message: string; data: ZoneType[]; meta: any }> {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.CAMERAS_DETECTION_TYPE);
      return response.data;
    } catch (error) {
      console.error('Error getting zone types:', error);
      throw error;
    }
  }
}

const detectionZoneService = new DetectionZoneService();

export default detectionZoneService;
