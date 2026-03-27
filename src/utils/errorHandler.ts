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
  apiResponse?: ApiErrorResponse;
  timestamp: number;
  screen?: string;
  action?: string;
}

/** API validation errors: { "images.0": ["error msg"], "field": ["msg1", "msg2"] } */
export interface ApiErrorResponse {
  message?: string;
  success?: boolean;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

/**
 * Get and format all validation errors from the API response for display.
 * @param error - Error object from catch (may have apiResponse if passed through axios interceptor)
 * @returns Full string: main message + list of validation errors
 */
export function getApiErrorDisplayMessage(error: any): string {
  const mainMessage = error?.message || 'An error occurred';
  const apiResponse = error?.apiResponse as ApiErrorResponse | undefined;
  const validationErrors = formatApiValidationErrors(apiResponse);
  if (validationErrors) {
    return `${mainMessage}\n\n${validationErrors}`;
  }
  return mainMessage;
}

/**
 * Format object errors từ API (vd: { "images.0": ["msg"], "field": ["msg"] }) thành chuỗi hiển thị.
 */
export function formatApiValidationErrors(apiResponse?: ApiErrorResponse | null): string {
  const errors = apiResponse?.errors;
  if (!errors || typeof errors !== 'object') return '';

  const lines: string[] = [];
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      // images.0 -> "Image 1", images.1 -> "Image 2" (user-friendly, 1-based)
      let label = field;
      if (field.startsWith('images.')) {
        const idx = parseInt(field.replace('images.', ''), 10);
        label = !isNaN(idx) ? `Image ${idx + 1}` : field;
      }
      messages.forEach((msg) => lines.push(`• ${label}: ${msg}`));
    }
  }
  return lines.join('\n');
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
