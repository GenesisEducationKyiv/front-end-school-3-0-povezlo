import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Result } from 'neverthrow';
import { DomainError, observableToResult } from '@app/shared/lib/result';

export interface RequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | string[]>;
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly baseUrl: string = '';

  constructor(protected http: HttpClient) {}

  protected get<T>(
    url: string,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return observableToResult(
      this.http.get<T>(this.getFullUrl(url), options)
    );
  }

  protected post<T>(
    url: string,
    body: unknown,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return observableToResult(
      this.http.post<T>(this.getFullUrl(url), body, options)
    );
  }

  protected put<T>(
    url: string,
    body: unknown,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return observableToResult(
      this.http.put<T>(this.getFullUrl(url), body, options)
    );
  }

  protected patch<T>(
    url: string,
    body: unknown,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return observableToResult(
      this.http.patch<T>(this.getFullUrl(url), body, options)
    );
  }

  protected delete<T>(
    url: string,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    return observableToResult(
      this.http.delete<T>(this.getFullUrl(url), options)
    );
  }

  protected resultToObservable<T>(
    result: Observable<Result<T, DomainError>>
  ): Observable<T> {
    return result.pipe(
      switchMap(res =>
        res.match(
          value => of(value),
          error => throwError(() => error)
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

  // Helper methods for common patterns

  protected getList<T>(endpoint: string, params?: Record<string, string | number>): Observable<Result<T[], DomainError>> {
    const options: RequestOptions = params !== undefined ? { params: this.buildParams(params) } : {};
    return this.get<T[]>(endpoint, options);
  }

  protected getById<T>(endpoint: string, id: string | number): Observable<Result<T, DomainError>> {
    return this.get<T>(`${endpoint}/${String(id)}`);
  }

  protected create<T>(endpoint: string, data: unknown): Observable<Result<T, DomainError>> {
    return this.post<T>(endpoint, data);
  }

  protected update<T>(
    endpoint: string,
    id: string | number,
    data: unknown
  ): Observable<Result<T, DomainError>> {
    return this.put<T>(`${endpoint}/${String(id)}`, data);
  }

  protected partialUpdate<T>(
    endpoint: string,
    id: string | number,
    data: unknown
  ): Observable<Result<T, DomainError>> {
    return this.patch<T>(`${endpoint}/${String(id)}`, data);
  }

  protected remove<T = boolean>(endpoint: string, id: string | number): Observable<Result<T, DomainError>> {
    return this.delete<T>(`${endpoint}/${String(id)}`);
  }

  private buildParams(params: Record<string, string | number>): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
