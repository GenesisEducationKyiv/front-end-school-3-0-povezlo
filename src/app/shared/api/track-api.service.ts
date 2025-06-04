import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Result } from 'neverthrow';
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
import { BaseApiService } from './base-api.service';
import { DomainError } from '@app/shared/lib/result';

interface TrackListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  genre?: string;
  artist?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackApiService extends BaseApiService {
  protected override readonly baseUrl = '/api';

  public getAll(params?: TrackListParams): Observable<Result<PaginatedTracksResponse, DomainError>> {
    return this.getList<unknown>('tracks', params as Record<string, string | number>).pipe(
      map(result => result.map(response => PaginatedTracksResponseSchema.parse(response)))
    );
  }

  public getBySlug(slug: string): Observable<Result<Track, DomainError>> {
    return this.get<unknown>(`tracks/${slug}`).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }

  public createTrack(data: TrackCreate): Observable<Result<Track, DomainError>> {
    return this.create<unknown>('tracks', data).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Result<Track, DomainError>> {
    return this.update<unknown>('tracks', id, data).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }

  public deleteTrack(id: string): Observable<Result<void, DomainError>> {
    return this.delete<unknown>(`tracks/${id}`).pipe(
      map(result => result.map(() => void 0))
    );
  }

  public deleteMany(ids: string[]): Observable<Result<BulkDeleteResponse, DomainError>> {
    return this.post('tracks/delete', { ids }).pipe(
      map(result => result.map(response => BulkDeleteResponseSchema.parse(response)))
    );
  }

  public uploadFile(id: string, file: File): Observable<Result<Track, DomainError>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post(`tracks/${id}/upload`, formData).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }

  public deleteFile(id: string): Observable<Result<Track, DomainError>> {
    return this.delete<unknown>(`tracks/${id}/file`).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }

  // Helper methods using inherited BaseApiService methods

  // Get track by ID (alternative to getBySlug)
  public getTrackById(id: string): Observable<Result<Track, DomainError>> {
    return this.getById<unknown>('tracks', id).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }

  // Search tracks with typed parameters
  public searchTracks(searchParams: {
    query?: string;
    genre?: string;
    artist?: string;
    limit?: number;
  }): Observable<Result<PaginatedTracksResponse, DomainError>> {
    return this.getList<unknown>('tracks/search', searchParams as Record<string, string | number>).pipe(
      map(result => result.map(response => PaginatedTracksResponseSchema.parse(response)))
    );
  }
}
