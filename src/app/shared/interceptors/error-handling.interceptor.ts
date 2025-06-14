import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Simplified interceptor - only basic logging
 * The main error handling takes place in ErrorHandlingService.
 */
@Injectable()
export class ErrorHandlingInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          console.debug('[HTTP Interceptor]', {
            url: request.url,
            method: request.method,
            status: error.status,
            timestamp: new Date().toISOString()
          });
        }

        // We simply pass the error on without any conversions.
        // Detailed processing will be in ErrorHandlingService
        return throwError(() => error);
      })
    );
  }
}
