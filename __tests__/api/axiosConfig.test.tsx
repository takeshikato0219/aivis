// __tests__/api/axiosConfig.test.ts
const mockStore = {
  getState: jest.fn(() => ({ auth: { accessToken: 'access', refreshToken: 'refresh' } })),
  dispatch: jest.fn(),
};
jest.mock('@redux/store', () => ({
  store: mockStore,
}));

jest.mock('../../src/utils/errorHandler', () => ({
  handleNetworkError: jest.fn(),
  handleApiError: jest.fn((error) => error),
}));
jest.mock('../../src/utils/networkMonitor', () => ({
  isConnected: jest.fn(() => true),
}));
jest.mock('@utils/authStorage', () => ({
  removeAuthData: jest.fn(async () => {}),
  updateTokens: jest.fn(async () => {}),
}));

jest.mock('axios', () => {
  const handlers = {
    request: {
      handlers: [],
      use: jest.fn(function (fulfilled, rejected) {
        this.handlers.push({ fulfilled, rejected });
        return 0;
      }),
    },
    response: {
      handlers: [],
      use: jest.fn(function (fulfilled, rejected) {
        this.handlers.push({ fulfilled, rejected });
        return 0;
      }),
    },
  };
  const instance = {
    interceptors: handlers,
    request: jest.fn().mockResolvedValue({ data: 'ok' }),
  };
  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      create: jest.fn(() => instance),
      mockInstance: instance,
      ...instance,
    }),
  };
});

// @ts-ignore
let axiosInstance;

describe('axiosConfig', () => {
  beforeEach(() => {
    jest.resetModules();
    axiosInstance = require('../../src/api/axiosConfig').default;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if not connected', async () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor');
    NetworkMonitor.isConnected.mockReturnValue(false);

    const config = { headers: {}, url: '/test' };
    expect(() => {
      // @ts-ignore
      axiosInstance.interceptors.request.handlers[0].fulfilled(config);
    }).toThrow('No internet connection');
  });

  it('should add Authorization header if token exists', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor');
    NetworkMonitor.isConnected.mockReturnValue(true); // Ensure network is "connected"

    // Mock store to return token
    mockStore.getState.mockReturnValue({
      // @ts-ignore
      auth: { accessToken: 'test-token' },
    });

    const config = { headers: {}, url: '/test' };
    // @ts-ignore
    const result = axiosInstance.interceptors.request.handlers[0].fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('should not add Authorization header if no token', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor');
    NetworkMonitor.isConnected.mockReturnValue(true); // Ensure network is "connected"

    // Mock store to return no token
    mockStore.getState.mockReturnValue({
      // @ts-ignore
      auth: { accessToken: null },
    });

    const config = { headers: {}, url: '/test' };
    // @ts-ignore
    const result = axiosInstance.interceptors.request.handlers[0].fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should call ErrorHandler.handleNetworkError on request error', async () => {
    const ErrorHandler = require('../../src/utils/errorHandler');
    const error = new Error('Request error');
    // @ts-ignore
    await expect(axiosInstance.interceptors.request.handlers[0].rejected(error)).rejects.toThrow(
      'Request error'
    );
    expect(ErrorHandler.handleNetworkError).toHaveBeenCalledWith(error);
  });

  it('should return response in response interceptor', () => {
    const mockResponse = { data: { message: 'ok' }, status: 200 };

    // Call the fulfilled function from interceptor
    // @ts-ignore
    const result = axiosInstance.interceptors.response.handlers[0].fulfilled(mockResponse);

    expect(result).toBe(mockResponse); // This covers line 27
  });
});

describe('axiosConfig refresh token and error handling', () => {
  // @ts-ignore
  let store;
  // @ts-ignore
  let authService;
  // @ts-ignore
  let ErrorHandler;
  // @ts-ignore
  let removeAuthData;
  let updateTokens;
  // @ts-ignore
  let logout;
  beforeEach(() => {
    jest.resetModules();
    store = require('@redux/store').store;
    axiosInstance = require('../../src/api/axiosConfig').default;
    const axios = require('axios');
    // @ts-ignore
    axiosMockInstance = axios.mockInstance;
    authService = require('@/services/authService').default;
    ErrorHandler = require('../../src/utils/errorHandler');
    removeAuthData = require('@utils/authStorage').removeAuthData;
    updateTokens = require('@utils/authStorage').updateTokens;
    // @ts-ignore
    setTokens = require('@redux/slices/authSlice').setTokens;
    logout = require('@redux/slices/authSlice').logout;
    store.getState = jest.fn(() => ({
      auth: { accessToken: 'access', refreshToken: 'refresh' },
    }));
    store.dispatch = jest.fn();
    authService.refreshToken = jest.fn(async () => ({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    }));
    ErrorHandler.handleApiError = jest.fn((e) => e);
    removeAuthData.mockResolvedValue();
    updateTokens.mockResolvedValue();
  });

  it('should skip refresh for login endpoint', async () => {
    const error = {
      config: { url: '/auth/login', headers: {}, _retry: undefined },
      response: { status: 401, data: {} },
    };
    // @ts-ignore
    const resInterceptor = axiosInstance.interceptors.response.handlers[0].rejected;
    await expect(resInterceptor(error)).rejects.toEqual(error);
    // @ts-ignore
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('should reject if no refresh token', async () => {
    // @ts-ignore
    store.getState = jest.fn(() => ({ auth: { accessToken: 'x', refreshToken: null } }));
    const error = {
      config: { url: '/api/protected', headers: {}, _retry: undefined },
      response: { status: 401, data: {} },
    };
    // @ts-ignore
    const resInterceptor = axiosInstance.interceptors.response.handlers[0].rejected;
    await expect(resInterceptor(error)).rejects.toEqual(error);
    // @ts-ignore
    expect(removeAuthData).toHaveBeenCalled();
    // @ts-ignore
    expect(store.dispatch).toHaveBeenCalledWith(logout());
    // @ts-ignore
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });

  it('should handle refresh token failure', async () => {
    // @ts-ignore
    authService.refreshToken = jest.fn(async () => {
      throw new Error('refresh fail');
    });
    const error = {
      config: { url: '/api/protected', headers: {}, _retry: undefined },
      response: { status: 401, data: {} },
    };
    // @ts-ignore
    const resInterceptor = axiosInstance.interceptors.response.handlers[0].rejected;
    await expect(resInterceptor(error)).rejects.toEqual(error);
    // @ts-ignore
    expect(removeAuthData).toHaveBeenCalled();
    // @ts-ignore
    expect(store.dispatch).toHaveBeenCalledWith(logout());
    // @ts-ignore
    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith(error);
  });
});
