import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { GenreApiService } from '@app/shared';

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private genres$: Observable<string[]> | null = null;

  private genreApi = inject(GenreApiService);

  public getGenres(): Observable<string[]> {
    if (this.genres$ === null) {
      this.genres$ = this.genreApi.getAll().pipe(
        switchMap(result => result.match(
          genres => [genres],
          error => {
            console.error('Error loading genres:', error);
            return of([]);
          }
        )),
        shareReplay(1)
      );
    }

    return this.genres$;
  }

  public clearCache(): void {
    this.genres$ = null;
  }
}
