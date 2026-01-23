import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  ChangePasswordResponse,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  User,
} from '@api/types/authTypes';

class AuthService {
  private mapLoginResponse(apiResponse: any): LoginResponse {
    const resData = apiResponse.data.data;
    return {
      accessToken: resData.access_token,
      refreshToken: resData.refresh_token,
      user: {
        id: resData.user_info.id,
        name: resData.user_info.name,
        email: resData.user_info.email,
        phone: resData.user_info.phone,
        line_user_id: resData.user_info.line_user_id,
        is_admin: resData.user_info.is_admin,
        is_active: resData.user_info.is_active,
        created_at: resData.user_info.created_at,
        updated_at: resData.user_info.updated_at,
        deleted_at: resData.user_info.deleted_at,
        avatar_path: resData.user_info.avatar_path,
        avatar_url: resData.user_info.avatar_url,
        status: resData.user_info.status,
        type: resData.user_info.type,
      },
    };
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return this.mapLoginResponse(response);
  }

  async getMe(token?: string): Promise<User> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME, config);
    const resData = response.data.data || response.data;
    return {
      id: resData.id,
      name: resData.name,
      email: resData.email,
      phone: resData.phone,
      line_user_id: resData.line_user_id,
      is_admin: resData.is_admin,
      is_active: resData.is_active,
      created_at: resData.created_at,
      updated_at: resData.updated_at,
      deleted_at: resData.deleted_at,
      avatar_path: resData.avatar_path,
      avatar_url: resData.avatar_url,
      status: resData.status,
      type: resData.type,
    };
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refresh_token: refreshToken,
    });
    return response.data.data || response.data;
  }

  async logout(): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async getProfile(): Promise<User> {
    const response = await axiosInstance.get<User>(API_ENDPOINTS.AUTH.GET_PROFILE);
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    confirm_password: string;
    name: string;
    phone: string;
    line_user_id?: string;
    avatar?: any;
  }): Promise<LoginResponse> {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('confirm_password', data.confirm_password);
    if (data.avatar) {
      formData.append('avatar', {
        uri: data.avatar.uri,
        type: data.avatar.type || 'image/jpeg',
        name: data.avatar.fileName || `avatar_${Date.now()}.jpg`,
      } as any);
    }
    formData.append('phone', data.phone);
    if (data.line_user_id) {
      formData.append('line_user_id', data.line_user_id);
    }

    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return this.mapLoginResponse(response);
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    line_user_id?: string;
    avatar?: any;
  }): Promise<User> {
    const formData = new FormData();

    if (data.name !== undefined) formData.append('name', data.name);
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    if (data.line_user_id !== undefined) formData.append('line_user_id', data.line_user_id);

    if (data.avatar) {
      formData.append('avatar', {
        uri: data.avatar.uri,
        type: data.avatar.type || 'image/jpeg',
        name: data.avatar.fileName || `avatar_${Date.now()}.jpg`,
      } as any);
    }

    const response = await axiosInstance.patch(API_ENDPOINTS.AUTH.ME, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const resData = response.data.data || response.data;
    return {
      id: resData.id,
      name: resData.name,
      email: resData.email,
      phone: resData.phone,
      line_user_id: resData.line_user_id,
      is_admin: resData.is_admin,
      is_active: resData.is_active,
      created_at: resData.created_at,
      updated_at: resData.updated_at,
      deleted_at: resData.deleted_at,
      avatar_path: resData.avatar_path,
      avatar_url: resData.avatar_url,
      status: resData.status,
      type: resData.type,
    };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ChangePasswordResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmPassword,
    });
    return response.data;
  }
}

export default new AuthService();
