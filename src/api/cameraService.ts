import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  RegisterCameraRequest,
  RegisterCameraResponse,
  GetCamerasParams,
  GetCamerasResponse,
} from './types/cameraTypes';

class CameraService {
  async registerCamera(data: RegisterCameraRequest): Promise<RegisterCameraResponse> {
    if (!data.id) {
      throw new Error('Missing required field: id');
    }

    const requestBody: any = {};

    // Chỉ thêm các fields optional vào body nếu có giá trị
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

    const response = await axiosInstance.get<GetCamerasResponse>(API_ENDPOINTS.CAMERAS, {
      params: queryParams,
    });

    return response.data;
  }
}

export default new CameraService();
