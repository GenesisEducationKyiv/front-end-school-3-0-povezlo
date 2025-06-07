import { Injectable } from '@angular/core';
import { z } from 'zod';
import { ValidatedApiService } from '@app/shared';
import { Observable } from 'rxjs';
import { Result } from '@app/shared';
import { DomainError } from '@app/shared';

export interface Genre {
  name: string;
}

export const GenreSchema = z.object({
  name: z.string().min(1, 'The genre name cannot be empty.')
});

export const GenreCreateSchema = z.object({
  name: z.string().min(1, 'The genre name cannot be empty.')
});

export const GenreUpdateSchema = z.object({
  name: z.string().min(1, 'The genre name cannot be empty.').optional()
});

export type GenreCreate = z.infer<typeof GenreCreateSchema>;
export type GenreUpdate = z.infer<typeof GenreUpdateSchema>;

export const GenreListSchema = z.array(z.string().min(1));
export const GenreResponseSchema = z.string().min(1);


@Injectable({
  providedIn: 'root'
})
export class ValidatedGenreApiService extends ValidatedApiService<
  Genre,
  GenreCreate,
  GenreUpdate
> {
  protected override readonly baseUrl = '/api';
  protected readonly entitySchema = GenreSchema;
  protected readonly createSchema = GenreCreateSchema;
  protected readonly updateSchema = GenreUpdateSchema;

  /**
   * Get all genres (returns an array of strings)
   */
  public getAll(): Observable<Result<string[], DomainError>> {
    return this.getValidated<string[]>('genres', GenreListSchema);
  }

  /**
   * An alternative method for compatibility with the old API
   */
  public getAllGenres(): Observable<Result<string[], DomainError>> {
    return this.getAll();
  }

  /**
   * Get genre by ID (returns a string)
   */
  public getGenreById(id: string): Observable<Result<string, DomainError>> {
    return this.getValidated<string>(`genres/${id}`, GenreResponseSchema);
  }

  /**
   * Create a new genre
   */
  public createGenre(name: string): Observable<Result<string, DomainError>> {
    return this.postValidated<string>('genres', { name }, GenreResponseSchema, {
      requestSchema: GenreCreateSchema
    });
  }

  /**
   * Update genre
   */
  public updateGenre(id: string, name: string): Observable<Result<string, DomainError>> {
    return this.putValidated<string>(`genres/${id}`, { name }, GenreResponseSchema, {
      requestSchema: GenreCreateSchema
    });
  }

  /**
   * Delete genre
   */
  public deleteGenre(id: string): Observable<Result<boolean, DomainError>> {
    return this.deleteValidated<boolean>(`genres/${id}`, z.boolean());
  }
}
