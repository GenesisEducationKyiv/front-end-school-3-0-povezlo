import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { z } from 'zod';
import { Result } from '@app/shared';
import { DomainError } from '@app/shared';
import { validateWithZod, validateObservableWithZod } from '@app/shared';
import { ErrorHandlingService } from '../services';
import { isDefined } from '@app/shared';

export interface RequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | string[]>;
}

export interface ValidatedRequestOptions extends RequestOptions {
  responseSchema?: z.ZodSchema;
  requestSchema?: z.ZodSchema;
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly baseUrl: string = '';
  protected errorHandler = inject(ErrorHandlingService);

  constructor(protected http: HttpClient) {}

  protected getValidated<T>(
    url: string,
    responseSchema: z.ZodSchema<T>,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return this.http.get<unknown>(this.getFullUrl(url), options).pipe(
      catchError(error => {
        const handledError = this.errorHandler.handleError(error, {
          method: 'GET',
          url: this.getFullUrl(url),
          component: this.constructor.name
        });
        return throwError(() => handledError);
      }),
      validateObservableWithZod(responseSchema),
      switchMap(result => of(result))
    );
  }

  protected postValidated<TResponse>(
    url: string,
    body: unknown,
    responseSchema: z.ZodSchema<TResponse>,
    options?: ValidatedRequestOptions
  ): Observable<Result<TResponse, DomainError>> {
    if (isDefined(options?.requestSchema)) {
      const bodyValidation = validateWithZod(options.requestSchema, body);
      if (Result.isError(bodyValidation)) {
        return of(bodyValidation);
      }
    }

    return this.http.post<unknown>(this.getFullUrl(url), body, options).pipe(
      catchError(error => {
        const handledError = this.errorHandler.handleError(error, {
          method: 'POST',
          url: this.getFullUrl(url),
          component: this.constructor.name
        });
        return throwError(() => handledError);
      }),
      validateObservableWithZod(responseSchema),
      switchMap(result => of(result))
    );
  }

  protected putValidated<TResponse>(
    url: string,
    body: unknown,
    responseSchema: z.ZodSchema<TResponse>,
    options?: ValidatedRequestOptions
  ): Observable<Result<TResponse, DomainError>> {
    //  Validate the request body if there is a schema
    if (isDefined(options?.requestSchema)) {
      const bodyValidation = validateWithZod(options.requestSchema, body);
      if (Result.isError(bodyValidation)) {
        return of(bodyValidation);
      }
    }

    return this.http.put<unknown>(this.getFullUrl(url), body, options).pipe(
      catchError(error => {
        const handledError = this.errorHandler.handleError(error, {
          method: 'PUT',
          url: this.getFullUrl(url),
          component: this.constructor.name
        });
        return throwError(() => handledError);
      }),
      validateObservableWithZod(responseSchema),
      switchMap(result => of(result))
    );
  }

  protected patchValidated<TResponse>(
    url: string,
    body: unknown,
    responseSchema: z.ZodSchema<TResponse>,
    options?: ValidatedRequestOptions
  ): Observable<Result<TResponse, DomainError>> {
    // Validate the request body if there is a schema
    if (isDefined(options?.requestSchema)) {
      const bodyValidation = validateWithZod(options.requestSchema, body);
      if (Result.isError(bodyValidation)) {
        return of(bodyValidation);
      }
    }

    return this.http.patch<unknown>(this.getFullUrl(url), body, options).pipe(
      catchError(error => {
        const handledError = this.errorHandler.handleError(error, {
          method: 'PATCH',
          url: this.getFullUrl(url),
          component: this.constructor.name
        });
        return throwError(() => handledError);
      }),
      validateObservableWithZod(responseSchema),
      switchMap(result => of(result))
    );
  }

  protected deleteValidated<T>(
    url: string,
    responseSchema: z.ZodSchema<T>,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return this.http.delete<unknown>(this.getFullUrl(url), options).pipe(
      catchError(error => {
        const handledError = this.errorHandler.handleError(error, {
          method: 'DELETE',
          url: this.getFullUrl(url),
          component: this.constructor.name
        });
        return throwError(() => handledError);
      }),
      validateObservableWithZod(responseSchema),
      switchMap(result => of(result))
    );
  }

  // Utility function for data validation
  protected validate<T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): Result<T, DomainError> {
    return validateWithZod(schema, data);
  }

  protected resultToObservable<T>(
    result: Observable<Result<T, DomainError>>
  ): Observable<T> {
    return result.pipe(
      switchMap(res =>
        Result.match(
          res,
          (value: T) => of(value),
          (error: DomainError) => throwError(() => error)
        )
      )
    );
  }

  // Build full URL
  private getFullUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint; // Full URL provided
    }

    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${baseUrl}${cleanEndpoint}`;
  }

// Helper methods with validation

  protected getListValidated<T>(
    endpoint: string,
    itemSchema: z.ZodSchema<T>,
    params?: Record<string, string | number>
  ): Observable<Result<T[], DomainError>> {
    const arraySchema = z.array(itemSchema);
    const options: RequestOptions = isDefined(params) ? { params: this.buildParams(params) } : {};
    return this.getValidated(endpoint, arraySchema, options);
  }

  protected getByIdValidated<T>(
    endpoint: string,
    id: string | number,
    schema: z.ZodSchema<T>
  ): Observable<Result<T, DomainError>> {
    return this.getValidated(`${endpoint}/${String(id)}`, schema);
  }

  protected createValidated<TResponse>(
    endpoint: string,
    data: unknown,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema
  ): Observable<Result<TResponse, DomainError>> {
    const options: ValidatedRequestOptions = isDefined(requestSchema) ? { requestSchema } : {};
    return this.postValidated(endpoint, data, responseSchema, options);
  }

  protected updateValidated<TResponse>(
    endpoint: string,
    id: string | number,
    data: unknown,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema
  ): Observable<Result<TResponse, DomainError>> {
    const options: ValidatedRequestOptions = isDefined(requestSchema) ? { requestSchema } : {};
    return this.putValidated(`${endpoint}/${String(id)}`, data, responseSchema, options);
  }

  protected partialUpdateValidated<TResponse>(
    endpoint: string,
    id: string | number,
    data: unknown,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema
  ): Observable<Result<TResponse, DomainError>> {
    const options: ValidatedRequestOptions = isDefined(requestSchema) ? { requestSchema } : {};
    return this.patchValidated(`${endpoint}/${String(id)}`, data, responseSchema, options);
  }

  protected removeValidated<T = boolean>(
    endpoint: string,
    id: string | number,
    responseSchema: z.ZodSchema<T>
  ): Observable<Result<T, DomainError>> {
    return this.deleteValidated(`${endpoint}/${String(id)}`, responseSchema);
  }

  private buildParams(params: Record<string, string | number>): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
