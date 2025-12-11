import { Alert } from 'react-native';

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  statusCode?: number;
  timestamp: number;
  screen?: string;
  action?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: AppError[] = [];
  private maxLogs = 50;
  private screenName: string = '';

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers() {
    const defaultHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.handleJSError(error, isFatal);
      defaultHandler(error, isFatal);
    });
  }

  private handleJSError(error: Error, isFatal?: boolean) {
    const appError: AppError = {
      type: ErrorType.UNKNOWN,
      message: error.message || 'Unknown error',
      originalError: error,
      timestamp: Date.now(),
    };
    this.logError(appError);
    if (isFatal) this.showFatalErrorAlert(error);
  }

  handleApiError(error: any, endpoint?: string): AppError {
    let errorType = ErrorType.API;
    let message = 'An error occurred';
    let statusCode: number | undefined;

    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.message || error.message;
      if (statusCode !== undefined && (statusCode === 401 || statusCode === 403)) {
        errorType = ErrorType.AUTHENTICATION;
        message = 'Please login again';
      } else if (statusCode !== undefined && statusCode >= 500) {
        message = 'Server error';
      }
    } else if (error.request) {
      errorType = ErrorType.NETWORK;
      message = 'Network error';
    }

    const appError: AppError = {
      type: errorType,
      message,
      originalError: error,
      statusCode,
      timestamp: Date.now(),
      action: endpoint,
    };

    this.logError(appError);
    return appError;
  }

  handleNetworkError(error: any): AppError {
    const appError: AppError = {
      type: ErrorType.NETWORK,
      message: 'Network connection failed',
      originalError: error,
      timestamp: Date.now(),
    };
    this.logError(appError);
    return appError;
  }

  private logError(error: AppError) {
    this.errorLogs.push(error);
    if (this.errorLogs.length > this.maxLogs) this.errorLogs.shift();
  }

  showErrorAlert(error: AppError, title = 'Error') {
    Alert.alert(title, error.message, [{ text: 'OK' }]);
  }

  private showFatalErrorAlert(error: Error) {
    Alert.alert('Application Error', `Please restart the app.\n${error.message}`, [{ text: 'OK' }]);
  }

  getErrorLogs(): AppError[] {
    return [...this.errorLogs];
  }

  getErrorStats() {
    return { total: this.errorLogs.length };
  }

  setScreen(screenName: string) {
    this.screenName = screenName;
  }
}

export default ErrorHandler.getInstance();
