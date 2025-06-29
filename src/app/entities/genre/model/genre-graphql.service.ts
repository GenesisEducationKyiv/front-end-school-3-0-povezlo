import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map, catchError, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Result, GenreErrors, GenreError } from '@app/shared';
import { GET_GENRES } from '@app/shared/graphql';

interface Genre {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class GenreGraphQLService {
  private genres$: Observable<Result<string[], GenreError>> | null = null;

  private apollo = inject(Apollo);

  public getGenres(): Observable<Result<string[], GenreError>> {
    if (!this.genres$) {
      this.genres$ = this.apollo.watchQuery<{ genres: Genre[] }>({
        query: GET_GENRES,
      }).valueChanges.pipe(
        map(result => {
          if (result.errors || !result.data) {
            console.error('GraphQL errors loading genres:', result.errors);
            return Result.Error(GenreErrors.fetchError('Failed to load genres from GraphQL API')) as Result<string[], GenreError>;
          }

          const genreNames = result.data.genres.map(genre => genre.name);
          console.log('Genres loaded successfully:', genreNames.length);
          return Result.Ok(genreNames) as Result<string[], GenreError>;
        }),
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
