import ErrorHandler, { ErrorType } from '../../src/utils/errorHandler';

describe('ErrorHandler', () => {
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
    expect(appError.message).toBe('Please login again');
  });

  it('handles network errors', () => {
    const mockError = {
      request: {},
      message: 'Network Error',
    };

    const appError = ErrorHandler.handleApiError(mockError);

    expect(appError.type).toBe(ErrorType.NETWORK);
  });
});
