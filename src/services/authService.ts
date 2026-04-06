import axiosInstance from '@api/axiosConfig';
import { API_ENDPOINTS } from '@api/apiEndpoints';
import {
  ChangePasswordResponse,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  SocialLoginRequest,
  User,
} from '@api/types/authTypes';

class AuthService {
  private mapLoginResponse(apiResponse: any): LoginResponse {
    const resData = apiResponse.data.data;
    return {
      accessToken: resData.access_token,
      refreshToken: resData.refresh_token,
      user: this.mapApiUserToUser(resData.user_info),
    };
  }

  private mapApiUserToUser(data: Record<string, any>): User {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      line_user_id: data.line_user_id,
      is_admin: data.is_admin,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at,
      avatar_path: data.avatar_path,
      avatar_url: data.avatar_url,
      agency_code: data.agency_code,
      status: data.status,
      type: data.type,
      has_followed_bot: data.has_followed_bot,
      line_notification_id: data.line_notification_id,
      line_display_name: data.line_display_name,
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
    return this.mapApiUserToUser(resData);
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
    has_followed_bot?: any;
    device_token?: string;
  }): Promise<User> {
    const formData = new FormData();

    if (data.name !== undefined) formData.append('name', data.name);
    if (data.email !== undefined) formData.append('email', data.email);
    if (data.phone !== undefined) formData.append('phone', data.phone);
    if (data.has_followed_bot !== undefined)
      formData.append('has_followed_bot', data.has_followed_bot);
    if (data.line_user_id !== undefined) formData.append('line_user_id', data.line_user_id);
    if (data.device_token !== undefined) formData.append('device_token', data.device_token);

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
    return this.mapApiUserToUser(resData);
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

  async socialLogin(data: SocialLoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return this.mapLoginResponse(response);
  }

  async socialAppleLogin(data: SocialLoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.APPLE_LOGIN, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return this.mapLoginResponse(response);
  }

  async socialLineLogin(data: SocialLoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LINE_LOGIN, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return this.mapLoginResponse(response);
  }

  async linkLineAccount(userId: string): Promise<any> {
    return axiosInstance.post(API_ENDPOINTS.AUTH.LINE_LINK, {
      line_user_id: userId,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async deleteUser(): Promise<any> {
    return axiosInstance.delete(`${API_ENDPOINTS.AUTH.DELETE}`);
  }
}

export default new AuthService();
