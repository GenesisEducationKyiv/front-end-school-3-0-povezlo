import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Option, QueryFilters, pipe } from '@app/shared';

export interface TrackFilters {
  search: Option<string>;
  genre: Option<string>;
  artist: Option<string>;
  page: Option<number>;
  limit: Option<number>;
  sortOrder: Option<'asc' | 'desc'>;
}

@Injectable({
  providedIn: 'root'
})
export class QueryParamsService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /**
   * Get all filter parameters from the URL as Option monads
   */
  public getTrackFilters(): Observable<TrackFilters> {
    return this.route.queryParams.pipe(
      map(queryParams => ({
        search: QueryFilters.extractSearchQuery(queryParams),
        genre: QueryFilters.extractGenreFilter(queryParams),
        artist: QueryFilters.extractArtistFilter(queryParams),
        page: QueryFilters.extractPageNumber(queryParams),
        limit: QueryFilters.extractPageSize(queryParams),
        sortOrder: QueryFilters.extractSortOrder(queryParams)
      }))
    );
  }

  /**
   * Update parameters in URL (immutable)
   */
  public updateQueryParams(updates: Partial<Record<string, string | number | null>>): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: updates,
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Clear all settings
   */
  public clearQueryParams(): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  /**
   * Combine several Option parameters into a filter object
   * Only specific values will be included in the result
   */
  public combineFiltersToParams(filters: TrackFilters): Record<string, string | number> {
    const result: Record<string, string | number> = {};

    Option.match(
      filters.search,
      (search) => { result['search'] = search; },
      () => { /* no-op */ }
    );

    Option.match(
      filters.genre,
      (genre) => { result['genre'] = genre; },
      () => { /* no-op */ }
    );

    Option.match(
      filters.artist,
      (artist) => { result['artist'] = artist; },
      () => { /* no-op */ }
    );

    Option.match(
      filters.page,
      (page) => { result['page'] = page; },
      () => { /* no-op */ }
    );

    Option.match(
      filters.limit,
      (limit) => { result['limit'] = limit; },
      () => { /* no-op */ }
    );

    Option.match(
      filters.sortOrder,
      (order) => { result['order'] = order; },
      () => { /* no-op */ }
    );

    return result;
  }

  /**
   * Create a URL with parameters for an API request
   */
  public createApiParams(filters: TrackFilters): {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  } {
    const apiParams: ReturnType<typeof this.createApiParams> = {};

    pipe(
      filters.search,
      Option.map(search => apiParams.search = search)
    );

    pipe(
      filters.genre,
      Option.map(genre => apiParams.genre = genre)
    );

    pipe(
      filters.artist,
      Option.map(artist => apiParams.artist = artist)
    );

    pipe(
      filters.page,
      Option.map(page => apiParams.page = page)
    );

    pipe(
      filters.limit,
      Option.map(limit => apiParams.limit = limit)
    );

    pipe(
      filters.sortOrder,
      Option.map(order => apiParams.order = order)
    );

    return apiParams;
  }
}
