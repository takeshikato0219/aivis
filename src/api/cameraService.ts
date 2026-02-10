import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  RegisterCameraRequest,
  RegisterCameraResponse,
  GetCamerasParams,
  GetCamerasResponse,
  GetWorkflowStatusesResponse,
  StatusCamera,
} from './types/cameraTypes';

class CameraService {
  async registerCamera(data: RegisterCameraRequest): Promise<RegisterCameraResponse> {
    if (!data.id) {
      throw new Error('Missing required field: id');
    }

    const requestBody: any = {};

    if (data.name) {
      requestBody.name = data.name;
    }
    if (data.status_id) {
      requestBody.status_id = data.status_id;
    }
    if (data.description) {
      requestBody.description = data.description;
    }

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
}

export default new CameraService();
