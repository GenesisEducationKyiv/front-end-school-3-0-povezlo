import { Injectable, inject, signal, computed } from '@angular/core';
import {
  injectQuery,
  injectMutation,
  QueryClient
} from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import {
  ValidatedTrackApiService,
  Result,
  isDefined,
  DomainError,
  QUERY_CACHE_TIMES,
  PAGINATION_DEFAULTS,
  SORT_DEFAULTS
} from '@app/shared';
import {
  Track,
  TrackCreate,
  TrackUpdate,
  PaginatedTracksResponse,
  BulkDeleteResponse
} from './track';

// Synchronize with TrackListParams from API service
export interface TrackFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  genre?: string;
  artist?: string;
  [key: string]: string | number | undefined; // Add index signature
}

@Injectable({
  providedIn: 'root'
})
export class TrackQueryService {
  private trackApi = inject(ValidatedTrackApiService);
  private queryClient = inject(QueryClient);

  private filtersSignal = signal<TrackFilters>({
    page: PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    sort: SORT_DEFAULTS.DEFAULT_SORT_FIELD,
    order: SORT_DEFAULTS.DEFAULT_SORT_ORDER
  });

  private selectedTracksSignal = signal<Set<string>>(new Set());

  // Public readonly signals
  public readonly filters = this.filtersSignal.asReadonly();
  public readonly selectedTracks = this.selectedTracksSignal.asReadonly();

  // Computed values
  public readonly hasSelectedTracks = computed(() =>
    this.selectedTracks().size > 0
  );

  public readonly selectedTrackIds = computed(() =>
    Array.from(this.selectedTracks())
  );

  // Query for fetching tracks
  public readonly tracksQuery = injectQuery(() => ({
    queryKey: ['tracks', this.filters()],
    queryFn: ({ queryKey }) => {
      const [, filters] = queryKey as [string, TrackFilters];
      return this.fetchTracks(filters);
    },
    staleTime: QUERY_CACHE_TIMES.DEFAULT_STALE_TIME,
    gcTime: QUERY_CACHE_TIMES.DEFAULT_GC_TIME,
  }));

  // Computed for convenient data access
  public readonly tracks = computed(() =>
    this.tracksQuery.data()?.data ?? []
  );

  public readonly pagination = computed(() => ({
    page: this.tracksQuery.data()?.meta.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: this.tracksQuery.data()?.meta.limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    total: this.tracksQuery.data()?.meta.total ?? 0,
    totalPages: this.tracksQuery.data()?.meta.totalPages ?? 0
  }));

  public readonly isLoading = computed(() =>
    this.tracksQuery.isPending()
  );

  public readonly error = computed(() =>
    this.tracksQuery.error()
  );

  // Mutation for creating track
  public readonly createTrackMutation = injectMutation(() => ({
    mutationFn: (trackData: TrackCreate) => this.createTrack(trackData),
    onSuccess: () => {
      void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  }));

  // Mutation for updating track
  public readonly updateTrackMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: string; data: TrackUpdate }) =>
      this.updateTrack(id, data),
    onSuccess: () => {
      void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  }));

  // Mutation for deleting track
  public readonly deleteTrackMutation = injectMutation(() => ({
    mutationFn: (id: string) => this.deleteTrack(id),
    onSuccess: () => {
      void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  }));

  // Mutation for bulk deletion
  public readonly bulkDeleteMutation = injectMutation(() => ({
    mutationFn: (ids: string[]) => this.bulkDeleteTracks(ids),
    onSuccess: () => {
      void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
      this.clearSelection();
    },
  }));

  // Methods for working with filters
  public updateFilters(newFilters: Partial<TrackFilters>): void {
    this.filtersSignal.update(current => ({
      ...current,
      ...newFilters
    }));
  }

  public resetFilters(): void {
    this.filtersSignal.set({
      page: PAGINATION_DEFAULTS.DEFAULT_PAGE,
      limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT,
      sort: SORT_DEFAULTS.DEFAULT_SORT_FIELD,
      order: SORT_DEFAULTS.DEFAULT_SORT_ORDER
    });
  }

  // Methods for working with track selection
  public toggleTrackSelection(trackId: string): void {
    this.selectedTracksSignal.update(current => {
      const newSet = new Set(current);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  }

  public selectAllTracks(): void {
    const allTrackIds = this.tracks().map(track => track.id);
    this.selectedTracksSignal.set(new Set(allTrackIds));
  }

  public clearSelection(): void {
    this.selectedTracksSignal.set(new Set());
  }

  public isTrackSelected(trackId: string): boolean {
    return this.selectedTracks().has(trackId);
  }

  // Methods for executing requests
  private async fetchTracks(filters: TrackFilters): Promise<PaginatedTracksResponse> {
    try {
      const params: TrackFilters = {};

      if (isDefined(filters.page)) params.page = filters.page;
      if (isDefined(filters.limit)) params.limit = filters.limit;
      if (isDefined(filters.sort)) params.sort = filters.sort;
      if (isDefined(filters.order)) params.order = filters.order;
      if (isDefined(filters.search)) params.search = filters.search;
      if (isDefined(filters.genre)) params.genre = filters.genre;
      if (isDefined(filters.artist)) params.artist = filters.artist;

      const result = await lastValueFrom(this.trackApi.getAll(params));

      return Result.match(
        result,
        (data: PaginatedTracksResponse) => data,
        (error: DomainError) => {
          throw new Error(error.message);
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  private async createTrack(trackData: TrackCreate): Promise<Track> {
    try {
      const result = await lastValueFrom(this.trackApi.createTrack(trackData));

      return Result.match(
        result,
        (data: Track) => data,
        (error: DomainError) => {
          throw new Error(error.message);
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  private async updateTrack(id: string, data: TrackUpdate): Promise<Track> {
    try {
      const result = await lastValueFrom(this.trackApi.updateTrack(id, data));

      return Result.match(
        result,
        (data: Track) => data,
        (error: DomainError) => {
          throw new Error(error.message);
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  private async deleteTrack(id: string): Promise<void> {
    try {
      const result = await lastValueFrom(this.trackApi.deleteTrack(id));

      Result.match(
        result,
        () => undefined,
        (error: DomainError) => {
          throw new Error(error.message);
        }
      );
      return;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  private async bulkDeleteTracks(ids: string[]): Promise<BulkDeleteResponse> {
    try {
      const result = await lastValueFrom(this.trackApi.deleteMany(ids));

      return Result.match(
        result,
        (data: BulkDeleteResponse) => data,
        (error: DomainError) => {
          throw new Error(error.message);
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // Methods for working with cache
  public refreshTracks(): void {
    void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
  }

  public prefetchTracks(filters: TrackFilters): void {
    void this.queryClient.prefetchQuery({
      queryKey: ['tracks', filters],
      queryFn: () => this.fetchTracks(filters),
      staleTime: QUERY_CACHE_TIMES.TRACK_PREFETCH_STALE_TIME,
    });
  }

  // Optimistic updates
  public async optimisticUpdateTrack(id: string, data: TrackUpdate): Promise<void> {
    await this.queryClient.cancelQueries({ queryKey: ['tracks'] });

    const previousData = this.queryClient.getQueryData(['tracks', this.filters()]);

    // Optimistically update cache
    this.queryClient.setQueryData(['tracks', this.filters()], (old: PaginatedTracksResponse | undefined) => {
      if (old == null) return old;

      return {
        ...old,
        data: old.data.map(track =>
          track.id === id ? { ...track, ...data } : track
        )
      };
    });

    try {
      await this.updateTrackMutation.mutateAsync({ id, data });
    } catch (error: unknown) {
      // Rollback changes on error
      this.queryClient.setQueryData(['tracks', this.filters()], previousData);
      throw error;
    }
  }
}
