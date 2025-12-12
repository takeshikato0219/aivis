import { API_ENDPOINTS } from '../../src/api/apiEndpoints';

describe('API_BASE_URL', () => {
  it('should be localhost in development', () => {
    (global as any).__DEV__ = true;
    jest.resetModules();
    const { API_BASE_URL: devUrl } = require('../../src/api/apiEndpoints');
    expect(devUrl).toBe('http://localhost:3000/api');
  });

  it('should be production URL otherwise', () => {
    (global as any).__DEV__ = false;
    jest.resetModules();
    const { API_BASE_URL: prodUrl } = require('../../src/api/apiEndpoints');
    expect(prodUrl).toBe('https://api.production.com');
  });
});

describe('API_ENDPOINTS', () => {
  it('should have expected auth endpoints', () => {
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
    expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
    expect(API_ENDPOINTS.AUTH.REFRESH_TOKEN).toBe('/auth/refresh');
    expect(API_ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe('/auth/forgot-password');
    expect(API_ENDPOINTS.AUTH.RESET_PASSWORD).toBe('/auth/reset-password');
    expect(API_ENDPOINTS.AUTH.VERIFY_EMAIL).toBe('/auth/verify-email');
    expect(API_ENDPOINTS.AUTH.GET_PROFILE).toBe('/auth/profile');
    expect(API_ENDPOINTS.AUTH.UPDATE_PROFILE).toBe('/auth/profile');
  });
});
