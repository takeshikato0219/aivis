import axiosInstance from './axiosConfig';
import { API_ENDPOINTS } from './apiEndpoints';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  }

  async logout(): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async getProfile(): Promise<User> {
    const response = await axiosInstance.get<User>(API_ENDPOINTS.AUTH.GET_PROFILE);
    return response.data;
  }

  async register(data: { email: string; password: string; name: string }): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password,
    });
  }
}

export default new AuthService();
