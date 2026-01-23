import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import ErrorHandler from '../utils/errorHandler';
import NetworkMonitor from '../utils/networkMonitor';
import { API_BASE_URL } from './apiEndpoints';
import { store } from '@redux/store';
import { getCurrentLanguage } from '@/i18n';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!NetworkMonitor.isConnected()) throw new Error('No internet connection');
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['Accept-Language'] = getCurrentLanguage();
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
    const processedError = ErrorHandler.handleApiError(error);
    return Promise.reject(processedError);
  }
);

export default axiosInstance;
