import { Injectable, inject, computed } from '@angular/core';
import {
  injectQuery,
  QueryClient
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { QUERY_CACHE_TIMES } from '@app/shared';
import { GenreGraphQLService } from './genre-graphql.service';
import { Genre } from './genre';

@Injectable({
  providedIn: 'root'
})
export class GenreQueryService {
  private genreGraphQL = inject(GenreGraphQLService);
  private queryClient = inject(QueryClient);

  // Query for fetching genres
  public readonly genresQuery = injectQuery(() => ({
    queryKey: ['genres'],
    queryFn: () => this.fetchGenres(),
    staleTime: QUERY_CACHE_TIMES.GENRE_STALE_TIME,
    gcTime: QUERY_CACHE_TIMES.GENRE_GC_TIME,
  }));

  // Computed for convenient data access
  public readonly genres = computed(() =>
    this.genresQuery.data() ?? []
  );

  public readonly genreNames = computed(() =>
    this.genres().map(genre => genre.name)
  );

  public readonly isLoading = computed(() =>
    this.genresQuery.isPending()
  );

  public readonly error = computed(() =>
    this.genresQuery.error()
  );

  // Methods for executing requests
  private async fetchGenres(): Promise<Genre[]> {
    try {
      const data = await firstValueFrom(this.genreGraphQL.getAll());
      return data.map(genre => ({ name: genre.name }));
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error('Unknown error occurred');
    }
  }

  // Methods for working with cache
  public refreshGenres(): void {
    void this.queryClient.invalidateQueries({ queryKey: ['genres'] });
  }

  // Utility methods
  public findGenreByName(name: string): Genre | undefined {
    return this.genres().find(genre => genre.name === name);
  }

  public hasGenre(name: string): boolean {
    return this.genres().some(genre => genre.name === name);
  }
}
