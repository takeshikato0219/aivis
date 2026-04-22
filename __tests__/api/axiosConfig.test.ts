import type { InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '@/api/apiEndpoints';
import { logout, setTokens } from '@redux/slices/authSlice';

const mockStore = {
  getState: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('@redux/store', () => ({
  store: mockStore,
}));

jest.mock('@/i18n', () => ({
  getCurrentLanguage: jest.fn(() => 'en'),
}));

jest.mock('@/api/refreshAccessToken', () => ({
  refreshAccessToken: jest.fn(),
}));

jest.mock('../../src/utils/errorHandler', () => ({
  __esModule: true,
  default: {
    handleNetworkError: jest.fn(),
    handleApiError: jest.fn((e: unknown) => e),
  },
}));

jest.mock('../../src/utils/networkMonitor', () => ({
  __esModule: true,
  default: {
    isConnected: jest.fn(() => true),
  },
}));

jest.mock('@utils/authStorage', () => ({
  removeAuthData: jest.fn(() => Promise.resolve()),
  updateTokens: jest.fn(() => Promise.resolve()),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => {
      const makeInterceptor = () => {
        const handlers: { fulfilled: unknown; rejected: unknown }[] = [];
        const use = jest.fn((fulfilled: unknown, rejected: unknown) => {
          handlers.push({ fulfilled, rejected });
          return 0;
        });
        return { handlers, use };
      };
      const requestInt = makeInterceptor();
      const responseInt = makeInterceptor();
      const instance = jest.fn().mockResolvedValue({ data: 'retry-ok' });
      (instance as any).interceptors = {
        request: requestInt,
        response: responseInt,
      };
      return instance;
    }),
  },
}));

let axiosInstance: jest.Mock & { interceptors: any };

function loadAxiosConfig() {
  axiosInstance = require('@/api/axiosConfig').default;
}

function getRequestHandler() {
  const h = (axiosInstance as any).interceptors.request.handlers[0];
  return h.fulfilled as (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
}

function getRequestErrorHandler() {
  const h = (axiosInstance as any).interceptors.request.handlers[0];
  return h.rejected as (e: unknown) => Promise<unknown>;
}

function getResponseSuccessHandler() {
  const h = (axiosInstance as any).interceptors.response.handlers[0];
  return h.fulfilled as <T>(r: T) => T;
}

function getResponseErrorHandler() {
  const h = (axiosInstance as any).interceptors.response.handlers[0];
  return h.rejected as (e: unknown) => Promise<unknown>;
}

describe('axiosConfig', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockStore.getState.mockReturnValue({
      auth: { accessToken: 'access', refreshToken: 'refresh' },
    });
    mockStore.dispatch.mockImplementation((a: unknown) => a);
    loadAxiosConfig();
  });

  it('creates axios with base URL, timeout, and JSON accept header', () => {
    const axios = require('axios').default;
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.any(String),
        timeout: 30000,
        headers: { accept: 'application/json' },
        withCredentials: false,
      })
    );
  });

  it('throws when offline', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor').default;
    NetworkMonitor.isConnected.mockReturnValue(false);

    expect(() =>
      getRequestHandler()({ headers: {}, url: '/test' } as InternalAxiosRequestConfig)
    ).toThrow('No internet connection');
  });

  it('adds Authorization when token exists and URL is not refresh', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor').default;
    NetworkMonitor.isConnected.mockReturnValue(true);
    mockStore.getState.mockReturnValue({ auth: { accessToken: 'test-token' } });

    const result = getRequestHandler()({ headers: {}, url: '/test' } as InternalAxiosRequestConfig);
    expect((result.headers as any).Authorization).toBe('Bearer test-token');
  });

  it('does not add Authorization when there is no access token', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor').default;
    NetworkMonitor.isConnected.mockReturnValue(true);
    mockStore.getState.mockReturnValue({ auth: { accessToken: null } });

    const result = getRequestHandler()({ headers: {}, url: '/test' } as InternalAxiosRequestConfig);
    expect((result.headers as any).Authorization).toBeUndefined();
  });

  it('does not add Authorization for refresh-token request', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor').default;
    NetworkMonitor.isConnected.mockReturnValue(true);
    mockStore.getState.mockReturnValue({ auth: { accessToken: 'at' } });

    const result = getRequestHandler()({
      headers: {},
      url: API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    } as InternalAxiosRequestConfig);
    expect((result.headers as any).Authorization).toBeUndefined();
  });

  it('sets Accept-Language and removes Cookie', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor').default;
    NetworkMonitor.isConnected.mockReturnValue(true);
    const { getCurrentLanguage } = require('@/i18n');
    getCurrentLanguage.mockReturnValue('ja');

    const result = getRequestHandler()({
      headers: { Cookie: 'a=b' },
      url: '/x',
    } as unknown as InternalAxiosRequestConfig);

    expect((result.headers as any)['Accept-Language']).toBe('ja');
    expect((result.headers as any).Cookie).toBeUndefined();
  });

  it('calls ErrorHandler.handleNetworkError on request error', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const error = new Error('Request error') as any;
    await expect(getRequestErrorHandler()(error)).rejects.toBe(error);
    expect(ErrorHandler.handleNetworkError).toHaveBeenCalledWith(error);
  });

  it('returns response unchanged on success', () => {
    const mockResponse = { data: { message: 'ok' }, status: 200 };
    expect(getResponseSuccessHandler()(mockResponse)).toBe(mockResponse);
  });
});

describe('axiosConfig response errors and refresh', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockStore.getState.mockReturnValue({
      auth: { accessToken: 'access', refreshToken: 'refresh' },
    });
    mockStore.dispatch.mockImplementation((a: unknown) => a);
    loadAxiosConfig();
  });

  const unauthorizedError = (opts: {
    url: string;
    httpStatus?: number;
    data?: Record<string, unknown>;
    _retry?: boolean;
  }) => {
    const { url, httpStatus = 401, data = {}, _retry } = opts;
    const config = { url, headers: {}, _retry } as any;
    return {
      name: 'AxiosError',
      message: 'fail',
      config,
      response: { status: httpStatus, data },
      isAxiosError: true,
    };
  };

  it('handles non-401 via ErrorHandler.handleApiError', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const error = unauthorizedError({ url: '/x', httpStatus: 500 });
    await expect(getResponseErrorHandler()(error)).rejects.toBe(error);
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('skips refresh when request already retried', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const { refreshAccessToken } = require('@/api/refreshAccessToken');
    const error = unauthorizedError({ url: '/members', _retry: true });
    await expect(getResponseErrorHandler()(error)).rejects.toBe(error);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('skips refresh for login endpoint', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const error = unauthorizedError({ url: API_ENDPOINTS.AUTH.LOGIN });
    await expect(getResponseErrorHandler()(error)).rejects.toBe(error);
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('treats api status_code 401 as unauthorized (no refresh token)', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const removeAuthData = require('@utils/authStorage').removeAuthData;
    mockStore.getState.mockReturnValue({ auth: { accessToken: 'a', refreshToken: null } });

    const error = unauthorizedError({
      url: '/members',
      httpStatus: 200,
      data: { status_code: 401 },
    });
    await expect(getResponseErrorHandler()(error)).rejects.toBe(error);
    expect(removeAuthData).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalledWith(logout());
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('rejects when refresh token is missing', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const removeAuthData = require('@utils/authStorage').removeAuthData;
    mockStore.getState.mockReturnValue({ auth: { accessToken: 'x', refreshToken: null } });

    const error = unauthorizedError({ url: '/api/protected' });
    await expect(getResponseErrorHandler()(error)).rejects.toBe(error);
    expect(removeAuthData).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalledWith(logout());
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('refreshes tokens, dispatches setTokens, updates storage, and retries request', async () => {
    const { refreshAccessToken } = require('@/api/refreshAccessToken');
    const updateTokens = require('@utils/authStorage').updateTokens;

    refreshAccessToken.mockResolvedValue({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });

    const error = unauthorizedError({ url: '/api/protected' });
    const result = await getResponseErrorHandler()(error);

    expect(refreshAccessToken).toHaveBeenCalledWith('refresh');
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      setTokens({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    );
    expect(updateTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(axiosInstance).toHaveBeenCalled();
    expect(result).toEqual({ data: 'retry-ok' });
  });

  it('reuses previous refresh token when API omits refresh_token', async () => {
    const { refreshAccessToken } = require('@/api/refreshAccessToken');
    const updateTokens = require('@utils/authStorage').updateTokens;

    refreshAccessToken.mockResolvedValue({ access_token: 'new-access' });

    await getResponseErrorHandler()(unauthorizedError({ url: '/api/protected' }));

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      setTokens({ accessToken: 'new-access', refreshToken: 'refresh' })
    );
    expect(updateTokens).toHaveBeenCalledWith('new-access', 'refresh');
  });

  it('logs out when refresh fails', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler').default;
    const removeAuthData = require('@utils/authStorage').removeAuthData;
    const { refreshAccessToken } = require('@/api/refreshAccessToken');

    refreshAccessToken.mockRejectedValue(new Error('refresh fail'));

    const error = unauthorizedError({ url: '/api/protected' });
    await expect(getResponseErrorHandler()(error)).rejects.toBe(error);
    expect(removeAuthData).toHaveBeenCalled();
    expect(mockStore.dispatch).toHaveBeenCalledWith(logout());
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });
});
