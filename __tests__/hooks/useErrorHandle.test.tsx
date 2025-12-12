// __tests__/hooks/useErrorHandler.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ErrorHandler, { ErrorType } from '../../src/utils/errorHandler';
import { useErrorHandler } from '../../src/hooks/useErrorHandler';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));
jest.mock('../../src/utils/errorHandler', () => ({
  handleApiError: jest.fn(),
  showErrorAlert: jest.fn(),
  ErrorType: { NETWORK: 'NETWORK', AUTHENTICATION: 'AUTHENTICATION' },
}));

describe('useErrorHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handleError calls ErrorHandler and shows alert', () => {
    const appError = { type: ErrorType.NETWORK, message: 'Network down' };
    (ErrorHandler.handleApiError as jest.Mock).mockReturnValue(appError);

    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError('error', true);
    });

    expect(ErrorHandler.handleApiError).toHaveBeenCalledWith('error');
    expect(ErrorHandler.showErrorAlert).toHaveBeenCalledWith(appError, 'Network Error');
  });

  it('handleError uses Auth Error title for authentication errors', () => {
    const appError = { type: ErrorType.AUTHENTICATION, message: 'Auth failed' };
    (ErrorHandler.handleApiError as jest.Mock).mockReturnValue(appError);

    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError('error', true);
    });

    expect(ErrorHandler.showErrorAlert).toHaveBeenCalledWith(appError, 'Auth Error');
  });

  it('handleError uses default title for other errors', () => {
    const appError = { type: 'OTHER', message: 'Other error' };
    (ErrorHandler.handleApiError as jest.Mock).mockReturnValue(appError);

    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError('error', true);
    });

    expect(ErrorHandler.showErrorAlert).toHaveBeenCalledWith(appError, 'Error');
  });

  it('handleError does not show alert if showAlert is false', () => {
    const appError = { type: ErrorType.NETWORK, message: 'Network down' };
    (ErrorHandler.handleApiError as jest.Mock).mockReturnValue(appError);

    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleError('error', false);
    });

    expect(ErrorHandler.showErrorAlert).not.toHaveBeenCalled();
  });

  it('handleNetworkError shows network alert', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => {
      result.current.handleNetworkError();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'No Internet Connection',
      'Please check your connection.'
    );
  });
});
