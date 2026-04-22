import axiosInstance from '@api/axiosConfig';
import { API_ENDPOINTS } from '@api/apiEndpoints';

export interface Rule {
  id: string;
  rule_name: string;
  code: string;
  facility_id: string;
  facility_name: string | null;
  start_time: string;
  end_time: string;
  weekdays: number[];
  notification_message_template: string;
  is_active: boolean;
}

export interface RulesResponse {
  success: boolean;
  message: string;
  data: Rule[];
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

class RulesService {
  async getRules(params?: {
    facility_id?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }): Promise<RulesResponse> {
    const response = await axiosInstance.get<RulesResponse>(`${API_ENDPOINTS.RULES_MASTER}`, {
      params: {
        sort_by: 'sort_order',
        sort_order: 'asc',
        page: 1,
        per_page: 50,
        ...params,
      },
    });
    return response.data;
  }
}

export default new RulesService();
