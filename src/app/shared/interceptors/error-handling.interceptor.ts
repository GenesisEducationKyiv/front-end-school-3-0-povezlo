import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Result } from 'neverthrow';
import {
  DomainError,
  NetworkError,
  createNetworkError,
  createUnknownError,
  observableToResult,
} from '@app/shared/lib/result';
import { HttpStatusCode, HTTP_ERROR_MESSAGES } from '@app/shared/lib';

@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        const domainError = this.mapHttpErrorToDomainError(error);

        console.error('HTTP Error intercepted:', {
          url: request.url,
          method: request.method,
          error: domainError
        });

        return throwError(() => domainError);
      })
    );
  }

  private mapHttpErrorToDomainError(error: unknown): DomainError {
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpErrorResponse(error);
    }

    if (error instanceof Error) {
      return createUnknownError(error.message, { originalError: error });
    }

    return createUnknownError('Unknown error occurred', { originalError: error });
  }

  private handleHttpErrorResponse(error: HttpErrorResponse): NetworkError {
    const status = error.status as HttpStatusCode;
    let message: string;

    if (status in HTTP_ERROR_MESSAGES) {
      message = HTTP_ERROR_MESSAGES[status];
    } else {
      message = error.message !== '' ? error.message : `HTTP error ${String(status)}`;
    }

    return createNetworkError(message, status);
  }
}

export function httpToResult<T>(
  httpCall: Observable<T>
): Observable<Result<T, DomainError>> {
  return observableToResult<T, DomainError>(httpCall);
}

export function resultToHttp<T>(
  result: Observable<Result<T, DomainError>>
): Observable<T> {
  return result.pipe(
    map((res) =>
      res.match(
        (value) => value,
        (error) => {
          throw new Error(JSON.stringify(error));
        }
      )
    )
  );
}
