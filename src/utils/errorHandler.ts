import { showCommonAlert } from '@components/Alert/Alert';

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
  apiStatusCode?: number;
  apiResponse?: any;
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
    let apiStatusCode: number | undefined;
    let apiResponse: any;
    if (error.response) {
      const httpStatusCode = error.response.status;
      apiResponse = error.response.data;
      apiStatusCode = apiResponse?.status_code;
      statusCode = apiStatusCode || httpStatusCode;
      message = apiResponse?.message || error.message || message;

      // Handle specific HTTP status codes
      if (httpStatusCode === 401 || httpStatusCode === 403) {
        errorType = ErrorType.AUTHENTICATION;
      }
    } else if (error.request) {
      errorType = ErrorType.NETWORK;
      message = 'Network error';
    }

    const appError: AppError = {
      type: errorType,
      message,
      originalError: error,
      statusCode: statusCode,
      apiStatusCode,
      apiResponse,
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
    showCommonAlert({ title, message: error.message, buttons: [{ text: 'OK' }] });
  }

  private showFatalErrorAlert(error: Error) {
    showCommonAlert({
      title: 'Application Error',
      message: `Please restart the app.\n${error.message}`,
      buttons: [{ text: 'OK' }],
    });
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
