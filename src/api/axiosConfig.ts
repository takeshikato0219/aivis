import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import ErrorHandler from '../utils/errorHandler';
import NetworkMonitor from '../utils/networkMonitor';
import { API_BASE_URL } from './apiEndpoints';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!NetworkMonitor.isConnected()) throw new Error('No internet connection');
    const token = '';
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => {
    ErrorHandler.handleNetworkError(error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const appError = ErrorHandler.handleApiError(error, error.config?.url);
    return Promise.reject(appError);
  }
);

export default axiosInstance;
