import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';

export interface PolicyItem {
  id: string;
  title: string;
  type: number;
  description: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export interface PoliciesResponse {
  items: PolicyItem[];
  total: number;
  limit: number;
  offset: number;
}

class PolicyService {
  async getPolicies(type: number, limit = 100, offset = 0): Promise<PoliciesResponse> {
    const response = await axiosInstance.get(API_ENDPOINTS.POLICIES, {
      params: { type, limit, offset },
      headers: { accept: 'application/json' },
    });
    return response.data;
  }
}

export default new PolicyService();