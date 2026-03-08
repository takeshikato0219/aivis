export const API_BASE_URL = 'https://avis-api-dev.unlimited.io.vn/api/v1';

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
    GOOGLE_LOGIN: '/oauth/google/login',
    LINE_LOGIN: '/oauth/line/login',
    LINE_LINK: '/oauth/line/link',
  },
  // Cameras
  CAMERAS: '/cameras',
  FACILITIES: '/facilities',
  CAMERAS_DETECTION_TYPE: '/camerasdetection-types',
  // Face
  MEMBER_RELATIONSHIPS: '/member-relationships',
  MEMBERS: '/members',

  // Status Camera
  STATUSES: '/statuses',

  // Rule Master List
  RULES_MASTER: '/rules-master',

  //policies
  POLICIES: '/policies',
};

export type ApiEndpoints = typeof API_ENDPOINTS;
