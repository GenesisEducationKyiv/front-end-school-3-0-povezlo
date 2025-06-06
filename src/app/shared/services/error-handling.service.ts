import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import {
  DomainError,
  NetworkError,
  ValidationError,
  createNetworkError,
  createUnknownError,
} from '@app/shared/lib/result';
import {HttpStatusCode, HTTP_ERROR_MESSAGES, DomainErrorCode, isObject, isDefined} from '@app/shared/lib';

export interface ErrorContext {
  url?: string;
  method?: string;
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  [key: string]: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  delay: number;
  exponentialBackoff: boolean;
  retryableStatusCodes: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    delay: 1000,
    exponentialBackoff: true,
    retryableStatusCodes: [
      HttpStatusCode.REQUEST_TIMEOUT,
      HttpStatusCode.TOO_MANY_REQUESTS,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      HttpStatusCode.BAD_GATEWAY,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      HttpStatusCode.GATEWAY_TIMEOUT
    ]
  };

  /**
   * Main error handling method
   */
  handleError(error: unknown, context?: ErrorContext): DomainError {
    const domainError = this.mapToDomainError(error);
    const enrichedError = this.enrichWithContext(domainError, context);

    this.logError(enrichedError, context);

    return enrichedError;
  }

  /**
   * Format error for user display
   */
  getUserFriendlyMessage(error: DomainError): string {
    switch (error.code) {
      case DomainErrorCode.VALIDATION_ERROR:
        return this.formatValidationError(error);
      case DomainErrorCode.NETWORK_ERROR:
        return this.formatNetworkError(error);
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Retry operator for Observable with automatic error handling
   */
  withRetry<T>(config: Partial<RetryConfig> = {}) {
    const retryConfig = { ...this.defaultRetryConfig, ...config };

    return (source: Observable<T>) => source.pipe(
      retry({
        count: retryConfig.maxRetries,
        delay: (error, retryIndex) => {
          const shouldRetry = this.shouldRetry(error, retryIndex, retryConfig);

          if (!shouldRetry) {
            return throwError(() => this.handleError(error));
          }

          const delay = this.calculateDelay(retryIndex, retryConfig);
          console.warn(`Retry attempt ${String(retryIndex + 1)}/${String(retryConfig.maxRetries)} in ${String(delay)}ms`, error);

          return timer(delay);
        }
      })
    );
  }

  /**
   * Check if request should be retried
   */
  shouldRetry(error: unknown, retryCount: number, config: RetryConfig): boolean {
    if (retryCount >= config.maxRetries) {
      return false;
    }

    if (error instanceof HttpErrorResponse) {
      return config.retryableStatusCodes.includes(error.status);
    }

    if (this.isDomainError(error)) {
      return error.code === DomainErrorCode.NETWORK_ERROR;
    }

    return false;
  }

  /**
   * Calculate retry delay
   */
  calculateDelay(retryCount: number, config: RetryConfig): number {
    if (!config.exponentialBackoff) {
      return config.delay;
    }

    const exponentialDelay = config.delay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;

    return Math.min(exponentialDelay + jitter, 30000);
  }

  private mapToDomainError(error: unknown): DomainError {
    if (this.isDomainError(error)) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      return this.handleHttpErrorResponse(error);
    }

    if (error instanceof Error) {
      return this.handleJavaScriptError(error);
    }

    if (typeof error === 'string') {
      return createUnknownError(error);
    }

    return createUnknownError('Unknown error', { originalError: error });
  }

  private handleHttpErrorResponse(error: HttpErrorResponse): NetworkError {
    const status = error.status as HttpStatusCode;
    let message: string;

    // Check for custom server message
    if (isObject(error.error) && 'message' in error.error) {
      message = (error.error as { message: string }).message;
    } else if (status in HTTP_ERROR_MESSAGES) {
      message = HTTP_ERROR_MESSAGES[status];
    } else {
      message = (error.message !== '' ? error.message : undefined) ?? `HTTP error ${String(status)}`;
    }

    const networkError = createNetworkError(message, status);

    // Add server response details
    if (isObject(error.error)) {
      return {
        ...networkError,
        details: {
          ...(typeof networkError.details === 'object' ? networkError.details : {}),
          serverResponse: error.error,
          url: error.url ?? undefined
        }
      };
    }

    return networkError;
  }

  private handleJavaScriptError(error: Error): DomainError {
    if (error.name === 'NetworkError' || error.message.includes('Failed to fetch')) {
      return createNetworkError('Network connection error');
    }

    if (error.name === 'AbortError') {
      return createNetworkError('Request was cancelled');
    }

    if (error.name === 'TimeoutError') {
      return createNetworkError('Request timeout');
    }

    return createUnknownError(error.message, {
      stack: error.stack,
      name: error.name
    });
  }

  private isDomainError(error: unknown): error is DomainError {
    return (
      isObject(error) &&
      'code' in error &&
      'message' in error &&
      Object.values(DomainErrorCode).includes((error as { code: DomainErrorCode }).code)
    );
  }

  private enrichWithContext(error: DomainError, context?: ErrorContext): DomainError {
    if (context === undefined) {
      return error;
    }

    return {
      ...error,
      details: {
        ...(typeof error.details === 'object' ? error.details : { originalDetails: error.details }),
        context: {
          ...context,
          timestamp: context.timestamp ?? new Date()
        }
      }
    };
  }

  private logError(error: DomainError, context?: ErrorContext): void {
    const logLevel = this.getLogLevel(error);
    const logData = {
      error,
      context,
      timestamp: new Date().toISOString()
    };

    switch (logLevel) {
      case 'error':
        console.error('[ErrorHandlingService]', logData);
        break;
      case 'warn':
        console.warn('[ErrorHandlingService]', logData);
        break;
      case 'info':
        console.info('[ErrorHandlingService]', logData);
        break;
    }
  }

  private getLogLevel(error: DomainError): 'error' | 'warn' | 'info' {
    if (error.code === DomainErrorCode.VALIDATION_ERROR) {
      return 'warn';
    }

    if (error.code === DomainErrorCode.NETWORK_ERROR) {
      const networkError = error;
      if (isDefined(networkError.status) && (networkError.status as HttpStatusCode) >= HttpStatusCode.INTERNAL_SERVER_ERROR) {
        return 'error';
      }
      if (isDefined(networkError.status) && (networkError.status as HttpStatusCode) >= HttpStatusCode.BAD_REQUEST) {
        return 'warn';
      }
    }

    return 'error';
  }

  private formatValidationError(error: ValidationError): string {
    if (error.fields === undefined) {
      return error.message;
    }

    const fieldErrors = Object.entries(error.fields)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');

    return `Validation error: ${fieldErrors}`;
  }

  private formatNetworkError(error: NetworkError): string {
    if (isDefined(error.status)) {
      const errorStatus = error.status as HttpStatusCode;
      switch (errorStatus) {
        case HttpStatusCode.UNAUTHORIZED:
          return HTTP_ERROR_MESSAGES[errorStatus];
        case HttpStatusCode.FORBIDDEN:
          return HTTP_ERROR_MESSAGES[errorStatus];
        case HttpStatusCode.NOT_FOUND:
          return HTTP_ERROR_MESSAGES[errorStatus];
        case HttpStatusCode.INTERNAL_SERVER_ERROR:
          return HTTP_ERROR_MESSAGES[errorStatus];
        case HttpStatusCode.BAD_GATEWAY:
          return HTTP_ERROR_MESSAGES[errorStatus];
        case HttpStatusCode.SERVICE_UNAVAILABLE:
          return HTTP_ERROR_MESSAGES[errorStatus];
        default:
          return error.message;
      }
    }

    return 'Network error. Please check your internet connection';
  }
}
