import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from '@app/shared';

interface HttpOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService,
  ) {}

  public get<T>(endpoint: string, queryParams?: Record<string, string | number | boolean>, headers?: HttpHeaders): Observable<T> {
    let params = new HttpParams();

    if (queryParams !== undefined) {
      Object.keys(queryParams).forEach(key => {
        const value = queryParams[key];
        if (value !== undefined) {
          params = params.set(key, String(value));
        }
      });
    }

    const options: HttpOptions = { params };
    if (headers !== undefined) {
      options.headers = headers;
    }

    return this.http.get<T>(this.apiConfig.getUrl(endpoint), options);
  }

  public post<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    const options: HttpOptions = {};

    if (headers !== undefined) {
      options.headers = headers;
    }

    return this.http.post<T>(this.apiConfig.getUrl(endpoint), body, options);
  }

  public put<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    const options: HttpOptions = {};

    if (headers !== undefined) {
      options.headers = headers;
    }

    return this.http.put<T>(this.apiConfig.getUrl(endpoint), body, options);
  }

  public delete<T>(endpoint: string, headers?: HttpHeaders): Observable<T> {
    const options: HttpOptions = {};

    if (headers !== undefined) {
      options.headers = headers;
    }

    return this.http.delete<T>(this.apiConfig.getUrl(endpoint), options);
  }
}
