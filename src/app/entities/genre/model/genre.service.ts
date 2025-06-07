import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { shareReplay, map, catchError } from 'rxjs/operators';
import { ValidatedGenreApiService } from '@app/shared/api/validated-genre-api.service';
import { Result, GenreErrors, GenreError } from '@app/shared';

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private genres$: Observable<Result<string[], GenreError>> | null = null;

  private genreApi = inject(ValidatedGenreApiService);

  public getGenres(): Observable<Result<string[], GenreError>> {
    if (this.genres$ === null) {
      this.genres$ = this.genreApi.getAll().pipe(
        map(apiResult => Result.match(
          apiResult,
          (genres: string[]) => {
            console.log('Genres loaded successfully:', genres.length);
            return Result.Ok(genres) as Result<string[], GenreError>;
          },
          () => {
            console.error('Error loading genres from API');
            return Result.Error(GenreErrors.fetchError('Failed to load genres from API')) as Result<string[], GenreError>;
          }
        )),
        catchError(error => {
          console.error('Network error loading genres:', error);
          return of(Result.Error(GenreErrors.fetchError(
            'Network error while loading genres',
            { error }
          )));
        }),
        shareReplay(1)
      );
    }

    return this.genres$;
  }

  public clearCache(): void {
    this.genres$ = null;
  }
}
