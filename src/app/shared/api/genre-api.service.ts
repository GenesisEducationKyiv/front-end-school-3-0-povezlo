import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Result } from 'neverthrow';
import { BaseApiService } from './base-api.service';
import { DomainError } from '@app/shared/lib/result';

@Injectable({
  providedIn: 'root'
})
export class GenreApiService extends BaseApiService {
  protected override readonly baseUrl = '/api';

  public getAll(): Observable<Result<string[], DomainError>> {
    return this.getList<string>('genres');
  }

  // Alternative method using base get method
  public getAllGenres(): Observable<Result<string[], DomainError>> {
    return this.get<string[]>('genres');
  }

  // Method to get a specific genre (if needed)
  public getGenreById(id: string): Observable<Result<string, DomainError>> {
    return this.getById<string>('genres', id);
  }

  // Method to create a new genre (if API supports it)
  public createGenre(name: string): Observable<Result<string, DomainError>> {
    return this.create<string>('genres', { name });
  }

  // Method to update a genre (if API supports it)
  public updateGenre(id: string, name: string): Observable<Result<string, DomainError>> {
    return this.update<string>('genres', id, { name });
  }

  // Method to delete a genre (if API supports it)
  public deleteGenre(id: string): Observable<Result<boolean, DomainError>> {
    return this.remove('genres', id);
  }
}
