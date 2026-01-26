// __tests__/api/axiosConfig.test.ts
import axiosInstance from '../../src/api/axiosConfig';

jest.mock('../../src/utils/errorHandler', () => ({
  handleNetworkError: jest.fn(),
  handleApiError: jest.fn((error) => error),
}));
jest.mock('../../src/utils/networkMonitor', () => ({
  isConnected: jest.fn(() => true),
}));

describe('axiosConfig', () => {
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
    const store = require('@redux/store');
    NetworkMonitor.isConnected.mockReturnValue(true); // Ensure network is "connected"

    // Mock store to return token
    store.store.getState = jest.fn().mockReturnValue({
      auth: { accessToken: 'test-token' },
    });

    const config = { headers: {}, url: '/test' };
    // @ts-ignore
    const result = axiosInstance.interceptors.request.handlers[0].fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('should not add Authorization header if no token', () => {
    const NetworkMonitor = require('../../src/utils/networkMonitor');
    const store = require('@redux/store');
    NetworkMonitor.isConnected.mockReturnValue(true); // Ensure network is "connected"

    // Mock store to return no token
    store.store.getState = jest.fn().mockReturnValue({
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
