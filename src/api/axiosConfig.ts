import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import ErrorHandler from '../utils/errorHandler';
import NetworkMonitor from '../utils/networkMonitor';
import { API_BASE_URL, API_ENDPOINTS } from './apiEndpoints';
import { store } from '@redux/store';
import { getCurrentLanguage } from '@/i18n';
import authService from './authService';
import { logout, setTokens } from '@redux/slices/authSlice';
import { removeAuthData, updateTokens } from '@utils/authStorage';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    accept: 'application/json',
  },
  withCredentials: false,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const skipRefreshEndpoints = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.REFRESH_TOKEN,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH.RESET_PASSWORD,
  API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
  API_ENDPOINTS.AUTH.LINE_LOGIN,
];

const shouldSkipRefresh = (url: string | undefined): boolean => {
  if (!url) return false;
  return skipRefreshEndpoints.some((endpoint) => url.includes(endpoint));
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!NetworkMonitor.isConnected()) throw new Error('No internet connection');
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    config.headers['Accept-Language'] = getCurrentLanguage();

    delete config.headers.Cookie;

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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const httpStatusCode = error.response?.status;
    const apiStatusCode = (error.response?.data as any)?.status_code;
    const isUnauthorized = httpStatusCode === 401 || apiStatusCode === 401;

    if (!isUnauthorized || originalRequest._retry) {
      const processedError = ErrorHandler.handleApiError(error);
      return Promise.reject(processedError);
    }

    if (shouldSkipRefresh(originalRequest.url)) {
      const processedError = ErrorHandler.handleApiError(error);
      return Promise.reject(processedError);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest.headers['Accept-Language'] = getCurrentLanguage();
          }
          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const state = store.getState();
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      processQueue(new Error('No refresh token'), null);
      await removeAuthData();
      store.dispatch(logout());
      const processedError = ErrorHandler.handleApiError(error);
      return Promise.reject(processedError);
    }

    try {
      const refreshResult = await authService.refreshToken(refreshToken);
      const newAccessToken = refreshResult.access_token;
      const newRefreshToken = refreshResult.refresh_token || refreshToken;

      store.dispatch(setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken }));

      await updateTokens(newAccessToken, newRefreshToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers['Accept-Language'] = getCurrentLanguage();
      }

      processQueue(null, newAccessToken);
      isRefreshing = false;

      return axiosInstance(originalRequest);
    } catch (refreshError: any) {
      isRefreshing = false;
      processQueue(refreshError, null);

      await removeAuthData();
      store.dispatch(logout());

      const processedError = ErrorHandler.handleApiError(error);
      return Promise.reject(processedError);
    }
  }
);

export default axiosInstance;
