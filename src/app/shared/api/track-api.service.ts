import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  BulkDeleteResponse,
  BulkDeleteResponseSchema,
  PaginatedTracksResponse,
  PaginatedTracksResponseSchema,
  Track,
  TrackCreate,
  TrackSchema,
  TrackUpdate
} from '@app/entities';
import { ApiService } from '@shared/lib/http';

@Injectable({
  providedIn: 'root'
})
export class TrackApiService {
  constructor(
    private api: ApiService
  ) {}

  public getAll(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  }): Observable<PaginatedTracksResponse> {
    return this.api.get<unknown>('tracks', params).pipe(
      map(response => PaginatedTracksResponseSchema.parse(response))
    );
  }

  public getBySlug(slug: string): Observable<Track> {
    return this.api.get<unknown>(`tracks/${slug}`).pipe(
      map(response => TrackSchema.parse(response))
    );
  }

  public create(data: TrackCreate): Observable<Track> {
    return this.api.post<unknown>('tracks', data).pipe(
      map(response => TrackSchema.parse(response))
    );
  }

  public update(id: string, data: TrackUpdate): Observable<Track> {
    return this.api.put<unknown>(`tracks/${id}`, data).pipe(
      map(response => TrackSchema.parse(response))
    );
  }

  public delete(id: string): Observable<void> {
    return this.api.delete<unknown>(`tracks/${id}`).pipe(
      map(() => void 0)
    );
  }

  public deleteMany(ids: string[]): Observable<BulkDeleteResponse> {
    return this.api.post<unknown>('tracks/delete', { ids }).pipe(
      map(response => BulkDeleteResponseSchema.parse(response))
    );
  }

  public uploadFile(id: string, file: File): Observable<Track> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<unknown>(`tracks/${id}/upload`, formData).pipe(
      map(response => TrackSchema.parse(response))
    );
  }

  public deleteFile(id: string): Observable<Track> {
    return this.api.delete<unknown>(`tracks/${id}/file`).pipe(
      map(response => TrackSchema.parse(response))
    );
  }
}
