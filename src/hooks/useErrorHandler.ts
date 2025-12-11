import { useCallback } from 'react';
import { Alert } from 'react-native';
import ErrorHandler, { ErrorType } from '../utils/errorHandler';

export const useErrorHandler = () => {
  const handleError = useCallback((error: any, showAlert = true) => {
    const appError = ErrorHandler.handleApiError(error);
    if (showAlert) {
      let title = 'Error';
      if (appError.type === ErrorType.NETWORK) title = 'Network Error';
      if (appError.type === ErrorType.AUTHENTICATION) title = 'Auth Error';
      ErrorHandler.showErrorAlert(appError, title);
    }
    return appError;
  }, []);

  const handleNetworkError = useCallback(() => {
    Alert.alert('No Internet Connection', 'Please check your connection.');
  }, []);

  return { handleError, handleNetworkError };
};
