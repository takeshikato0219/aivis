export const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://api.production.com';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    GET_PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
  },
};

export type ApiEndpoints = typeof API_ENDPOINTS;
