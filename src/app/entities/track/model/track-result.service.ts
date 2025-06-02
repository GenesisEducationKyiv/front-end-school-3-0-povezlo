import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Result, ok, err } from 'neverthrow';
import { TrackApiService } from '@app/shared';
import { Track, TrackCreate } from './track';
import { TrackSchema } from '@app/entities';
import {
  DomainError,
  observableToResult,
  createValidationError,
  ValidationError
} from '@app/shared';

/**
 * Example service demonstrating neverthrow usage for safe error handling
 */
@Injectable({
  providedIn: 'root'
})
export class TrackResultService {
  constructor(private trackApi: TrackApiService) {}

  /**
   * Get track by slug with Result type
   */
  public getTrackSafe(slug: string): Observable<Result<Track, DomainError>> {
    return observableToResult(this.trackApi.getBySlug(slug));
  }

  /**
   * Create track with validation
   */
  public createTrackSafe(data: TrackCreate): Observable<Result<Track, DomainError>> {
    // Validate input data first
    const validationResult = this.validateTrackData(data);
    if (validationResult.isErr()) {
      return new Observable(subscriber => {
        subscriber.next(err(validationResult.error));
        subscriber.complete();
      });
    }

    return observableToResult(this.trackApi.create(data));
  }

  /**
   * Validate track data before sending to API
   */
  private validateTrackData(data: TrackCreate): Result<TrackCreate, ValidationError> {
    const errors: Record<string, string[]> = {};

    if (data.title === '' || data.title.trim().length === 0) {
      errors['title'] = ['Title is required'];
    }

    if (data.artist === '' || data.artist.trim().length === 0) {
      errors['artist'] = ['Artist is required'];
    }

    if (data.genres.length === 0) {
      errors['genres'] = ['At least one genre is required'];
    }

    if (Object.keys(errors).length > 0) {
      return err(createValidationError('Validation failed', errors));
    }

    return ok(data);
  }

  /**
   * Parse and validate track from unknown data
   */
  public parseTrackSafe(data: unknown): Result<Track, ValidationError> {
    const parseResult = TrackSchema.safeParse(data);
    if (parseResult.success) {
      return ok(parseResult.data);
    }

    return err(createValidationError('Invalid track data', {
      data: ['Failed to parse track data']
    }));
  }
}
