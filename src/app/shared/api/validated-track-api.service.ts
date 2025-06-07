import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { Result } from '@app/shared';
import {isDefined, isNumber, isString, ValidatedApiService} from '@app/shared';
import { DomainError } from '@app/shared';
import {
  Track,
  TrackCreate,
  TrackUpdate,
  TrackSchema,
  TrackCreateSchema,
  TrackUpdateSchema,
  PaginatedTracksResponse,
  PaginatedTracksResponseSchema,
  BulkDeleteResponse,
  BulkDeleteResponseSchema
} from '@app/entities';

// Local type for track parameters
interface TrackListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  genre?: string;
  artist?: string;
  [key: string]: string | number | undefined; // Add index signature
}

/**
 * API service for working with tracks with automatic validation
 * Uses ValidatedApiService as base class
 * All old methods automatically get validation through override in base class
 */
@Injectable({
  providedIn: 'root'
})
export class ValidatedTrackApiService extends ValidatedApiService<Track, TrackCreate, TrackUpdate> {
  protected override readonly baseUrl = '/api';

  // Define schemas for automatic validation
  protected readonly entitySchema = TrackSchema;
  protected readonly createSchema = TrackCreateSchema;
  protected readonly updateSchema = TrackUpdateSchema;

  // Custom schemas for special cases
  private readonly paginatedResponseSchema = PaginatedTracksResponseSchema;
  private readonly bulkDeleteResponseSchema = BulkDeleteResponseSchema;
  private readonly voidSchema = z.null(); // Accept null from server

  // Override schemas for special operations
  protected override getResponseSchema(): z.ZodSchema<Track> {
    // Can add logic to determine needed schema
    return super.getResponseSchema();
  }

  protected override getDeleteResponseSchema(): z.ZodSchema<boolean> {
    // For track deletion return null, but parent expects boolean schema
    return z.boolean();
  }

  // ============================================================================
  // Main API methods (use automatic validation through ValidatedApiService)
  // ============================================================================

  /**
   * Get all tracks with pagination
   * Old method that now automatically uses validation
   */
  public getAll(params?: TrackListParams): Observable<Result<PaginatedTracksResponse, DomainError>> {
    // Call base getList, which automatically adds validation
    // But for PaginatedTracksResponse need special schema
    return this.getValidated<PaginatedTracksResponse>(
      'tracks',
      this.paginatedResponseSchema,
      isDefined(params) ? { params: this.convertParamsToHttpParams(params) } : undefined
    );
  }

  /**
   * Get track by slug
   * Old method that now automatically uses validation
   */
  public getBySlug(slug: string): Observable<Result<Track, DomainError>> {
    // Call base get, which automatically adds Track schema validation
    return this.get(`tracks/${slug}`);
  }

  /**
   * Create new track
   * Old method that now automatically uses validation
   */
  public createTrack(data: TrackCreate): Observable<Result<Track, DomainError>> {
    // Call base create, which automatically adds validation
    return this.create('tracks', data);
  }

  /**
   * Update track
   * Old method that now automatically uses validation
   */
  public updateTrack(id: string, data: TrackUpdate): Observable<Result<Track, DomainError>> {
    // Call base update, which automatically adds validation
    return this.update('tracks', id, data);
  }

  /**
   * Delete track
   * Old method that now automatically uses validation
   */
  public deleteTrack(id: string): Observable<Result<null, DomainError>> {
    // Use custom validation for null response
    return this.deleteValidated<null>(`tracks/${id}`, this.voidSchema);
  }

  /**
   * Bulk delete tracks
   * Custom method with special validation
   */
  public deleteMany(ids: string[]): Observable<Result<BulkDeleteResponse, DomainError>> {
    // Use postValidated with custom response schema WITHOUT request body validation
    // (request body { ids: string[] } doesn't require Track schema validation)
    return this.postValidated<BulkDeleteResponse>(
      'tracks/delete',
      { ids },
      this.bulkDeleteResponseSchema
    );
  }

  /**
   * Upload audio file for track
   * Custom method with Track response validation
   */
  public uploadFile(id: string, file: File): Observable<Result<Track, DomainError>> {
    const formData = new FormData();
    formData.append('file', file);

    // Use postValidated directly WITHOUT request body validation (FormData doesn't need validation)
    return this.postValidated<Track>(`tracks/${id}/upload`, formData, this.entitySchema);
  }

  /**
   * Delete track audio file
   */
  public deleteFile(id: string): Observable<Result<Track, DomainError>> {
    // Custom logic: DELETE returns updated Track, not undefined
    return this.deleteValidated<Track>(`tracks/${id}/file`, this.entitySchema);
  }

  // ============================================================================
  // Additional methods using inherited helper methods
  // ============================================================================

  /**
   * Get track by ID (alternative to getBySlug)
   * Uses inherited getById with automatic validation
   */
  public getTrackById(id: string): Observable<Result<Track, DomainError>> {
    // Call base getById, which automatically adds validation
    return this.getById('tracks', id);
  }

  /**
   * Search tracks with typed parameters
   */
  public searchTracks(searchParams: {
    query?: string;
    genre?: string;
    artist?: string;
    limit?: number;
  }): Observable<Result<PaginatedTracksResponse, DomainError>> {
    return this.getValidated<PaginatedTracksResponse>(
      'tracks/search',
      this.paginatedResponseSchema,
      { params: this.convertParamsToHttpParams(searchParams) }
    );
  }

  /**
   * Get tracks by genre
   */
  public getTracksByGenre(genre: string): Observable<Result<Track[], DomainError>> {
    // Call base getList, which automatically adds validation
    return this.getList('tracks', { genre });
  }

  /**
   * Get tracks by artist
   */
  public getTracksByArtist(artist: string): Observable<Result<Track[], DomainError>> {
    // Call base getList, which automatically adds validation
    return this.getList('tracks', { artist });
  }

  // ============================================================================
  // Data validation (additional utilities)
  // ============================================================================

  /**
   * Validate track data before sending
   */
  public validateTrackData(data: unknown): Result<Track, DomainError> {
    return this.validateEntity(data);
  }

  /**
   * Validate data for track creation
   */
  public validateCreateTrackData(data: unknown): Result<TrackCreate, DomainError> {
    return this.validateCreateData(data);
  }

  /**
   * Validate data for track update
   */
  public validateUpdateTrackData(data: unknown): Result<TrackUpdate, DomainError> {
    return this.validateUpdateData(data);
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Converts parameters to HttpParams for compatibility with base class
   */
  private convertParamsToHttpParams(params: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (isDefined(value)) {
        if (isString(value)) {
          result[key] = value;
        } else if (isNumber(value)) {
          result[key] = value.toString();
        } else if (typeof value === 'boolean') {
          result[key] = value.toString();
        } else {
          // For complex objects use JSON.stringify
          result[key] = JSON.stringify(value);
        }
      }
    });

    return result;
  }
}
