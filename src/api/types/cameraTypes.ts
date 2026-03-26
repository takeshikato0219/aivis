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

export interface WorkScheduleApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    camera_id: string;
    user_id: string;
    rules_master_id: string;
    facility_id: string;
    name: string;
    code: string;
    member_ids: string[];
    start_time: string;
    end_time: string;
    /** Attendance: check-out window (giờ tan ca), optional until backend always returns them */
    checkout_start_time?: string;
    checkout_end_time?: string;
    weekdays: number[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface StreamQuality {
  label: string;
  value: 'low' | 'medium' | 'high' | 'hd';
  resolution: string;
  bitrate: number;
}

export interface CameraMode {
  id: string;
  name: string;
  name_ja: string;
  description: string;
  description_ja: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  name_trans: string;
  description_trans: string;
}

export interface CameraModesResponse {
  success: boolean;
  message: string;
  data: CameraMode[];
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

export interface CameraDetailUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface CameraDetailFacility {
  id: string;
  name: string;
  name_ja: string;
  name_trans: string;
}

export interface CameraDetailStatus {
  id: string;
  name_trans: string;
}

export interface CameraDetailWorkflowStatus {
  id: string;
  status_id: string;
  created_at: string;
  updated_at: string;
}

export interface CameraDetailData {
  id: string;
  name: string;
  serial: string;
  location: string | null;
  rtsp_url: string;
  user_id: string;
  facility_id: string;
  status_id: string;
  mode_id: string | null;
  user: CameraDetailUser;
  facility: CameraDetailFacility;
  status: CameraDetailStatus;
  workflow_status: CameraDetailWorkflowStatus[];
  warehouse_entry_date: string;
  warehouse_exit_date: string;
  agency_info: any;
  description: string | null;
  created_at: string;
  updated_at: string;
  bluetooth_password: string;
  secret_key: string;
  stream_secret_key: string;
  cloudflare_tunnel_token: string;
}

export interface CameraDetailResponse {
  success: boolean;
  message: string;
  data: CameraDetailData;
}

export interface CustomerAttributeAgeGroups {
  under_30: number;
  from_30_to_49: number;
  above_50: number;
}

export interface CustomerAttributeSegment {
  age_groups: CustomerAttributeAgeGroups;
  total: number;
}

export interface CustomerAttributeReportData {
  female: CustomerAttributeSegment;
  male: CustomerAttributeSegment;
  unknown: CustomerAttributeSegment;
}

export interface CustomerAttributeReportResponse {
  success: boolean;
  message: string;
  data: CustomerAttributeReportData;
}

export interface CameraDetailApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    serial: string;
    bluetooth_password: string;
    location: string;
    rtsp_url: string;
    user_id: string;
    facility_id: string;
    status_id: string;
    mode_id: string;
    description: string;
    warehouse_entry_date: string;
    warehouse_exit_date: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
  };
}
