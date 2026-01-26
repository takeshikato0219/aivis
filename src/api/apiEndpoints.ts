export const API_BASE_URL = 'http://124.197.19.62:7743/api/v1';

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
    UPDATE_PROFILE: '/auth/profile',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    SOCIAL_LOGIN: '/auth/social-login',
  },
};

export type ApiEndpoints = typeof API_ENDPOINTS;
