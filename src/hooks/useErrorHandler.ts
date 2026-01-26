import { useCallback } from 'react';
import { showCommonAlert } from '@components/Alert/Alert';
import ErrorHandler, { ErrorType } from '../utils/errorHandler';
import { useTranslation } from 'react-i18next';

export const useErrorHandler = () => {
  const { t } = useTranslation();
  const handleError = useCallback((error: any, showAlert = true) => {
    const appError = ErrorHandler.handleApiError(error);
    if (showAlert) {
      let title = t('common.error');
      if (appError.type === ErrorType.NETWORK) title = t('common.networkError');
      if (appError.type === ErrorType.AUTHENTICATION) title = t('common.authError');
      ErrorHandler.showErrorAlert(appError, title);
    }
    return appError;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNetworkError = useCallback(() => {
    showCommonAlert({ title: t('offline.title'), message: t('offline.pleaseCheckYourConnection') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handleError, handleNetworkError };
};
