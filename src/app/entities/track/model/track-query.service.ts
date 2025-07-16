import { Injectable, inject, signal, computed } from '@angular/core';
import {
  injectQuery,
  injectMutation,
  QueryClient
} from '@tanstack/angular-query-experimental';
import { lastValueFrom, firstValueFrom } from 'rxjs';
import {
  isDefined,
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
import { TrackGraphQLService } from './track-graphql.service';
import {
  TracksInput,
  TrackSortField,
  SortOrder,
  Track as GQLTrack,
  TrackCreateInput,
  TrackUpdateInput,
} from '@shared/graphql/generated';

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
  private trackGraphQL = inject(TrackGraphQLService);
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
      // Map TrackFilters -> TracksInput (GraphQL)
      const input: TracksInput = {};

      // Pagination
      if (isDefined(filters.page) || isDefined(filters.limit)) {
        input.pagination = {
          page: filters.page ?? null,
          limit: filters.limit ?? null,
        };
      }

      // Filter
      if (isDefined(filters.search) || isDefined(filters.genre) || isDefined(filters.artist)) {
        input.filter = {
          search: filters.search ?? null,
          genre: filters.genre ?? null,
          artist: filters.artist ?? null,
        };
      }

      // Sort
        input.sort = {
        field: isDefined(filters.sort) && filters.sort !== ''
          ? this.normalizeSortField(filters.sort)
          : null,
        order: isDefined(filters.order)
          ? (filters.order.toUpperCase() as SortOrder)
          : null,
        };

      const gqlResult = await firstValueFrom(this.trackGraphQL.getTracks(input));

      return {
        data: gqlResult.data.map(track => this.fromGQLTrack(track)),
        meta: {
          total: gqlResult.pageInfo.total,
          page: gqlResult.pageInfo.page,
          limit: gqlResult.pageInfo.limit,
          totalPages: gqlResult.pageInfo.totalPages
        }
      };
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Unknown error occurred');
    }
  }

  private async createTrack(trackData: TrackCreate): Promise<Track> {
    try {
      const result = await lastValueFrom(
        this.trackGraphQL.createTrack(this.toCreateInput(trackData)),
      );
      return this.fromGQLTrack(result);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Unknown error occurred');
    }
  }

  private async updateTrack(id: string, data: TrackUpdate): Promise<Track> {
    try {
      const result = await lastValueFrom(
        this.trackGraphQL.updateTrack(id, this.toUpdateInput(data)),
      );
      return this.fromGQLTrack(result);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Unknown error occurred');
    }
  }

  private async deleteTrack(id: string): Promise<void> {
    try {
      const success = await lastValueFrom(this.trackGraphQL.deleteTrack(id));
      if (!success) throw new Error('Failed to delete track');
      return;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Unknown error occurred');
    }
  }

  private async bulkDeleteTracks(ids: string[]): Promise<BulkDeleteResponse> {
    try {
      const res = await lastValueFrom(this.trackGraphQL.deleteTracks(ids));
      return {
        success: res.successIds,
        failed: res.failedIds
      };
    } catch (error) {
      if (error instanceof Error) throw error;
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

  // File upload methods
  public async uploadFile(id: string, file: File): Promise<Track> {
    try {
      const gqlTrack = await lastValueFrom(this.trackGraphQL.uploadFile(id, file));
      const track = this.fromGQLTrack(gqlTrack);
      void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
      return track;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  public async deleteFile(id: string): Promise<Track> {
    try {
      const gqlTrack = await lastValueFrom(this.trackGraphQL.deleteFile(id));
      const track = this.fromGQLTrack(gqlTrack);
      void this.queryClient.invalidateQueries({ queryKey: ['tracks'] });
      return track;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // -------------------- Mapping helpers --------------------

  /** Map domain TrackCreate -> GraphQL TrackCreateInput */
  private toCreateInput(data: TrackCreate): TrackCreateInput {
    return {
      artist: data.artist,
      title: data.title,
      genres: data.genres,
      album: data.album ?? null,
      coverImage: data.coverImage ?? null,
    };
  }

  /** Map domain TrackUpdate -> GraphQL TrackUpdateInput */
  private toUpdateInput(data: TrackUpdate): TrackUpdateInput {
    return {
      artist: data.artist ?? null,
      title: data.title ?? null,
      genres: data.genres ?? null,
      album: data.album ?? null,
      coverImage: data.coverImage ?? null,
    };
  }

  /** Map GraphQL Track -> domain Track (convert nulls to undefined) */
  private fromGQLTrack(track: GQLTrack): Track {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album ?? undefined,
      genres: track.genres,
      slug: track.slug,
      coverImage: track.coverImage ?? undefined,
      audioFile: track.audioFile ?? undefined,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt,
    };
  }

  /** Convert frontend field (camelCase) to GraphQL enum (SNAKE_UPPER) */
  private normalizeSortField(field: string): TrackSortField {
    const snake = field
      .replace(/([a-z])([A-Z])/g, '$1_$2') // createdAt -> created_At
      .toUpperCase(); // created_At -> CREATED_AT

    if ((Object.values(TrackSortField) as string[]).includes(snake)) {
      return snake as TrackSortField;
    }

    // Fallback на CREATED_AT
    return TrackSortField.CreatedAt;
  }
}
