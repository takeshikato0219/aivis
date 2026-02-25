import axiosInstance from '../api/axiosConfig';
import { API_BASE_URL, API_ENDPOINTS } from '@api/apiEndpoints';

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

class Rule {
  async getRuleMasterList(): Promise<RuleMasterListApiResponse> {
    // Updated endpoint usage
    const url = `${API_BASE_URL}${API_ENDPOINTS.RULE_MASTER_LIST}`;
    const response = await axiosInstance.get<RuleMasterListApiResponse>(url);
    return response.data;
  }
}

export default Rule;
