export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  line_user_id?: string | null;
  line_display_name?: string | null;
  is_admin?: boolean;
  is_active?: boolean;
  has_followed_bot?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  avatar?: string | null;
  avatar_path?: string | null;
  avatar_url?: string | null;
  agency_code?: string | null;
  status?: string;
  type?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: object;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  error?: object;
}

export interface SocialLoginRequest {
  id_token: string;
}
