import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';

export interface RuleMasterResponse {
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

export interface RuleMasterListApiResponse {
  success: boolean;
  message: string;
  data: RuleMasterResponse[];
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

class RuleService {
  async getRuleMasterList(): Promise<RuleMasterListApiResponse> {
    const response = await axiosInstance.get<RuleMasterListApiResponse>(API_ENDPOINTS.RULES_MASTER);
    return response.data;
  }
}

export default new RuleService();
