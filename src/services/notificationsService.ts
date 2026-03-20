import axiosInstance from '@api/axiosConfig';
import { API_ENDPOINTS } from '@api/apiEndpoints';

export interface Notification {
  id: string;
  detection_id: string;
  camera_rules_id: string;
  rules_master_id: string;
  user_id: string;
  camera_id: string;
  line_user_id: string | null;
  message: string;
  is_seen: boolean;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    is_truncated: boolean;
  };
}

// Thêm interface cho Detection và DetectionResponse theo mẫu JSON
export interface Detection {
  id: string;
  user_id: string;
  camera_id: string;
  confidence: number;
  image_url: string;
  detected_at: string;
  event_type: string;
  camera_rules_id: string;
  rules_master_id: string;
  member_id: string;
  notification_message: string;
}

export interface DetectionResponse {
  success: boolean;
  message: string;
  data: Detection[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    is_truncated: boolean;
  };
}

class NotificationsService {
  async getNotifications(params?: {
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
    token?: string;
    is_seen?: boolean;
    user_id?: string;
    [key: string]: any;
  }): Promise<NotificationsResponse> {
    const headers: Record<string, string> = {};
    if (params) {
      Object.keys(params).forEach((key) => {
        if (key !== 'token' && params[key] !== undefined) {
          headers[`X-Param-${key}`] = String(params[key]);
        }
      });
    }
    const response = await axiosInstance.get<NotificationsResponse>(
      `${API_ENDPOINTS.NOTIFICATIONS}/`,
      {
        params: {
          sort_by: params?.sort_by || 'sent_at',
          sort_order: params?.sort_order || 'desc',
          page: params?.page,
          per_page: params?.per_page,
          is_seen: params?.is_seen,
          user_id: params?.user_id,
        },
        headers,
      }
    );
    return response.data;
  }

  async updateNotificationSeen(id: string, is_seen: boolean): Promise<Notification> {
    const response = await axiosInstance.patch<NotificationResponse>(
      `${API_ENDPOINTS.NOTIFICATIONS}/${id}`,
      { is_seen }
    );
    return response.data.data;
  }

  async getNotificationWithType(
    camera_id: string,
    event_type: string,
    detected_at?: string,
    pagination?: { page?: number; per_page?: number }
  ): Promise<DetectionResponse> {
    const params: Record<string, string | number> = { camera_id, event_type };
    if (detected_at) {
      params.detected_at = detected_at;
    }
    if (pagination?.page) params.page = pagination.page;
    if (pagination?.per_page) params.per_page = pagination.per_page;
    const response = await axiosInstance.get<DetectionResponse>(`${API_ENDPOINTS.DETECTIONS}`, {
      params,
    });
    return response.data;
  }
}

export default new NotificationsService();
