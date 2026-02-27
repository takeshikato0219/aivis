import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  RegisterCameraRequest,
  RegisterCameraResponse,
  GetCamerasParams,
  GetCamerasResponse,
  GetWorkflowStatusesResponse,
  StatusCamera,
  LiveStreamUrlResponse,
  RuleMasterListApiResponse,
  WorkScheduleApiResponse,
} from './types/cameraTypes';

class CameraService {
  async registerCamera(data: RegisterCameraRequest): Promise<RegisterCameraResponse> {
    if (!data.id) {
      throw new Error('Missing required field: id');
    }

    const requestBody: Record<string, string> = {};
    if (data.name !== undefined) requestBody.name = data.name;
    if (data.status_id !== undefined) requestBody.status_id = data.status_id;
    if (data.user_id !== undefined) requestBody.user_id = data.user_id;
    if (data.description !== undefined) requestBody.description = data.description;
    const response = await axiosInstance.patch<RegisterCameraResponse>(
      `${API_ENDPOINTS.CAMERAS}/${data.id}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async getCameras(params?: GetCamerasParams): Promise<GetCamerasResponse> {
    const queryParams: GetCamerasParams = {
      sort_by: params?.sort_by || 'created_at',
      sort_order: params?.sort_order || 'desc',
      page: params?.page || 1,
      per_page: params?.per_page || 20,
    };

    if (params?.facility_id) {
      queryParams.facility_id = params.facility_id;
    }

    const response = await axiosInstance.get<GetCamerasResponse>(API_ENDPOINTS.CAMERAS, {
      params: queryParams,
    });

    return response.data;
  }

  async getWorkflowStatuses(): Promise<GetWorkflowStatusesResponse> {
    const response = await axiosInstance.get<GetWorkflowStatusesResponse>(API_ENDPOINTS.FACILITIES);
    return response.data;
  }

  async updateStatus(): Promise<StatusCamera> {
    const response = await axiosInstance.get<StatusCamera>(API_ENDPOINTS.STATUSES);
    return response.data;
  }

  async getLiveStreamUrl(cameraId: string): Promise<LiveStreamUrlResponse> {
    const response = await axiosInstance.get<LiveStreamUrlResponse>(
      `${API_ENDPOINTS.CAMERAS}/${cameraId}/livestream`
    );
    return response.data;
  }

  async getRulesForCamera(cameraId: string): Promise<RuleMasterListApiResponse> {
    const response = await axiosInstance.get(`${API_ENDPOINTS.CAMERAS}/${cameraId}/rules`);
    return response.data;
  }

  async deleteCamera(cameraId: string): Promise<GetWorkflowStatusesResponse> {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.CAMERAS}/${cameraId}`);
    return response.data;
  }

  async getWorkScheduleForRule(cameraId: string, ruleId: string): Promise<WorkScheduleApiResponse> {
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.CAMERAS}/${cameraId}/rules/${ruleId}`
    );
    return response.data;
  }

  async updateWorkScheduleForRule(
    cameraId: string,
    ruleId: string,
    scheduleData: { [key: string]: any }
  ): Promise<WorkScheduleApiResponse> {
    const response = await axiosInstance.patch(
      `${API_ENDPOINTS.CAMERAS}/${cameraId}/rules/${ruleId}`,
      scheduleData
    );
    return response.data;
  }
}

export default new CameraService();
