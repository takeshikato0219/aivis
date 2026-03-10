import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';

export interface Notification {
  id: string;
  detection_id: string;
  camera_rules_id: string;
  rules_master_id: string;
  user_id: string;
  camera_id: string;
  line_user_id: string;
  message: string;
  is_seen: boolean;
  sent_at: string;
  created_at: string;
  updated_at: string;
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

class NotificationsService {
  async getNotifications(params?: {
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
    token?: string;
    [key: string]: any;
  }): Promise<NotificationsResponse> {
    const headers: Record<string, string> = {};
    if (params?.token) {
      headers.Authorization = `Bearer ${params.token}`;
    }
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
          page: params?.page || 1,
          per_page: params?.per_page || 10,
        },
        headers,
      }
    );
    return response.data;
  }
}

export default new NotificationsService();
