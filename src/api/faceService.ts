import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';

export interface MemberRelationship {
  id: string;
  name_trans: string;
}

export interface MemberImage {
  id: string;
  image_path: string;
  image_url: string;
}

export interface MemberRelationship {
  id: string;
  name: string;
}

export interface MemberOwner {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  relationship: MemberRelationship;
  owner: MemberOwner;
  note: string | null;
  images: MemberImage[];
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  user_id?: string;
  relationship_type_id?: string;
  image_urls?: string[];
}

export interface MembersResponse {
  success: boolean;
  message: string;
  data: Member[];
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

export interface UploadFaceResponse {
  success: boolean;
  message?: string;
}

class FaceService {
  async getMemberRelationships(): Promise<MemberRelationship[]> {
    const response = await axiosInstance.get<{
      success: boolean;
      message: string;
      data: MemberRelationship[];
    }>(API_ENDPOINTS.MEMBER_RELATIONSHIPS);
    return response.data.data;
  }

  async getMembers(params?: {
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }): Promise<MembersResponse> {
    const response = await axiosInstance.get<MembersResponse>(API_ENDPOINTS.MEMBERS, {
      params: {
        sort_by: 'created_at',
        sort_order: 'desc',
        page: 1,
        per_page: 20,
        ...params,
      },
    });
    return response.data;
  }

  async updateMember(
    memberId: string,
    data: FormData
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.patch<{ success: boolean; message: string }>(
      `${API_ENDPOINTS.MEMBERS}/${memberId}`,
      data,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  async getMember(memberId: string): Promise<Member> {
    const response = await axiosInstance.get<{ success: boolean; message: string; data: Member }>(
      `${API_ENDPOINTS.MEMBERS}/${memberId}`
    );
    return response.data.data;
  }

  async uploadFaces(data: FormData): Promise<UploadFaceResponse> {
    const response = await axiosInstance.post<UploadFaceResponse>(API_ENDPOINTS.MEMBERS, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export default new FaceService();
