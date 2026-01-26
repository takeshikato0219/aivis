import ErrorHandler, { ErrorType } from '../../src/utils/errorHandler';

// Mock showCommonAlert
jest.mock('../../src/components/Alert/Alert', () => ({
  showCommonAlert: jest.fn(),
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles API errors correctly', () => {
    const mockError = {
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    };

    const appError = ErrorHandler.handleApiError(mockError);

    expect(appError.type).toBe(ErrorType.API);
    expect(appError.message).toBe('Not found');
    expect(appError.statusCode).toBe(404);
  });

  it('handles authentication errors', () => {
    const mockError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };

    const appError = ErrorHandler.handleApiError(mockError);

    expect(appError.type).toBe(ErrorType.AUTHENTICATION);
    expect(appError.message).toBe('Unauthorized');
  });

  it('handles forbidden errors', () => {
    const mockError = {
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    };

    const appError = ErrorHandler.handleApiError(mockError);

    expect(appError.type).toBe(ErrorType.AUTHENTICATION);
    expect(appError.message).toBe('Forbidden');
  });

  it('handles network errors', () => {
    const mockError = {
      request: {},
      message: 'Network Error',
    };

    const appError = ErrorHandler.handleApiError(mockError);

    expect(appError.type).toBe(ErrorType.NETWORK);
  });

  it('handles unknown errors', () => {
    const mockError = new Error('Unknown error');

    const appError = ErrorHandler.handleApiError(mockError);

    expect(appError.type).toBe(ErrorType.API);
    expect(appError.message).toBe('An error occurred');
  });

  it('handles network errors with handleNetworkError', () => {
    const mockError = new Error('Network connection failed');

    const appError = ErrorHandler.handleNetworkError(mockError);

    expect(appError.type).toBe(ErrorType.NETWORK);
    expect(appError.message).toBe('Network connection failed');
  });

  it('shows error alert', () => {
    const { showCommonAlert } = require('../../src/components/Alert/Alert');
    const mockError = {
      type: ErrorType.API,
      message: 'Test error',
      timestamp: Date.now(),
    };

    ErrorHandler.showErrorAlert(mockError, 'Custom Title');

    expect(showCommonAlert).toHaveBeenCalledWith({
      title: 'Custom Title',
      message: 'Test error',
      buttons: [{ text: 'OK' }],
    });
  });

  it('shows error alert with default title', () => {
    const { showCommonAlert } = require('../../src/components/Alert/Alert');
    const mockError = {
      type: ErrorType.API,
      message: 'Test error',
      timestamp: Date.now(),
    };

    ErrorHandler.showErrorAlert(mockError);

    expect(showCommonAlert).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Test error',
      buttons: [{ text: 'OK' }],
    });
  });

  it('gets error logs', () => {
    const logs = ErrorHandler.getErrorLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it('gets error stats', () => {
    const stats = ErrorHandler.getErrorStats();
    expect(stats).toHaveProperty('total');
    expect(typeof stats.total).toBe('number');
  });

  it('sets screen name', () => {
    ErrorHandler.setScreen('HomeScreen');
    // This should not throw
    expect(() => ErrorHandler.setScreen('HomeScreen')).not.toThrow();
  });
});
