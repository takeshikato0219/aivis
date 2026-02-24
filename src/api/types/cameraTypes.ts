export interface RegisterCameraRequest {
  id: string;
  name?: string;
  status_id?: string;
  user_id?: string;
  description?: string;
}

export interface CameraStatus {
  id: string;
  name_trans: string;
}

export interface Camera {
  id: string;
  name: string;
  serial: string;
  rtsp_url: string;
  status?: string | CameraStatus;
  location?: string;
  facility_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterCameraResponse {
  success: boolean;
  message?: string;
  data?: Camera;
}

export interface GetCamerasParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  facility_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

export interface GetCamerasResponse extends PaginatedResponse<Camera> {
  success?: boolean;
  message?: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  name_ja: string;
  description: string;
  description_ja: string;
  name_trans: string;
  desc_trans: string;
}

export interface GetWorkflowStatusesResponse {
  success: boolean;
  message: string;
  data: WorkflowStatus[];
}

export interface StatusCamera {
  success: boolean;
  message: string;
  data: {
    id: string;
    name_trans: string;
  };
}

export type LiveStreamUrlResponse = {
  success: boolean;
  message: string;
  data: {
    live_url: string;
    mic: string;
    start_time: string;
    time_exp: string;
    exp_minutes: number;
  };
};
