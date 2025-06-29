import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ApolloQueryResult, FetchResult } from '@apollo/client/core';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import {
  Result,
  TrackErrors,
  TrackError
} from '@app/shared';
import { BulkDeleteResponse, PaginatedTracksResponse, Track, TrackCreate, TrackUpdate } from './track';
import {
  GET_TRACKS,
  GET_TRACK_BY_SLUG,
  CREATE_TRACK,
  UPDATE_TRACK,
  DELETE_TRACK,
  DELETE_TRACKS,
  UPLOAD_TRACK_FILE,
  DELETE_TRACK_FILE
} from '@app/shared/graphql';

interface TracksQueryInput {
  filter?: {
    search?: string;
    genre?: string;
    artist?: string;
  };
  sort?: {
    field: string;
    order: string;
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

interface GetTracksResponse {
  tracks: {
    data: Track[];
    pageInfo: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface GetTrackResponse {
  trackBySlug: Track | null;
}

interface CreateTrackResponse {
  createTrack: Track;
}

interface UpdateTrackResponse {
  updateTrack: Track;
}

interface DeleteTrackResponse {
  deleteTrack: boolean;
}

interface DeleteTracksResponse {
  deleteTracks: {
    successIds: string[];
    failedIds: string[];
  };
}

interface UploadTrackFileResponse {
  uploadTrackFile: Track;
}

interface DeleteTrackFileResponse {
  deleteTrackFile: Track;
}

@Injectable({
  providedIn: 'root'
})
export class TrackGraphQLService {
  private tracksCache = new BehaviorSubject<Track[]>([]);
  private apollo = inject(Apollo);

  public getTracks(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  }): Observable<Result<PaginatedTracksResponse, TrackError>> {
    const { page, limit, sort, order, search, genre, artist } = params;
    const input: TracksQueryInput = {};

    // Фильтрация
    if (search != null || genre != null || artist != null) {
      input.filter = {};
      if (search != null) input.filter.search = search;
      if (genre != null) input.filter.genre = genre;
      if (artist != null) input.filter.artist = artist;
    }

    // Сортировка
    if (sort != null) {
      const sortField = this.mapSortField(sort);
      input.sort = {
        field: sortField,
        order: order?.toUpperCase() ?? 'DESC'
      };
    }

    // Пагинация
    if (page != null || limit != null) {
      input.pagination = {
        page: page ?? 1,
        limit: limit ?? 10
      };
    }

    return this.apollo.watchQuery<GetTracksResponse>({
      query: GET_TRACKS,
      variables: { input }
    }).valueChanges.pipe(
      map((result: ApolloQueryResult<GetTracksResponse>) => {
        console.log('GraphQL getTracks raw result:', result);
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors loading tracks:', result.errors);
          return Result.Error(TrackErrors.fetchError(
            'Failed to fetch tracks',
            { params }
          )) as Result<PaginatedTracksResponse, TrackError>;
        }

        console.log('GraphQL getTracks data structure:', result.data);
        const response: PaginatedTracksResponse = {
          data: result.data.tracks.data,
          meta: result.data.tracks.pageInfo
        };

        console.log('Formatted response:', response);
        this.tracksCache.next([...response.data]);
        return Result.Ok(response) as Result<PaginatedTracksResponse, TrackError>;
      }),
      catchError(error => {
        console.error('Network error loading tracks:', error);
        return of(Result.Error(TrackErrors.fetchError(
          'Network error while fetching tracks',
          { error, params }
        )));
      })
    );
  }

  public getTrack(slug: string): Observable<Result<Track, TrackError>> {
    return this.apollo.watchQuery<GetTrackResponse>({
      query: GET_TRACK_BY_SLUG,
      variables: { slug }
    }).valueChanges.pipe(
      map((result: ApolloQueryResult<GetTrackResponse>) => {
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors loading track:', result.errors);
          return Result.Error(TrackErrors.notFoundError(slug)) as Result<Track, TrackError>;
        }

        if (result.data.trackBySlug == null) {
          return Result.Error(TrackErrors.notFoundError(slug)) as Result<Track, TrackError>;
        }

        return Result.Ok(result.data.trackBySlug) as Result<Track, TrackError>;
      }),
      catchError(error => {
        console.error('Network error loading track:', error);
        return of(Result.Error(TrackErrors.fetchError(
          `Network error while fetching track with slug: ${slug}`,
          { error, slug }
        )));
      })
    );
  }

  public createTrack(data: TrackCreate): Observable<Result<Track, TrackError>> {
    const tempId = `temp-${String(Date.now())}`;

    const optimisticTrack: Track = {
      id: tempId,
      title: data.title,
      artist: data.artist,
      album: data.album ?? undefined,
      genres: data.genres,
      slug: this.generateSlug(data.title, tempId),
      coverImage: data.coverImage,
      audioFile: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentTracks = this.tracksCache.getValue();
    // Создаем копию массива для безопасного обновления кэша
    this.tracksCache.next([optimisticTrack, ...currentTracks]);

    return this.apollo.mutate<CreateTrackResponse>({
      mutation: CREATE_TRACK,
      variables: { input: data }
    }).pipe(
      map((result: FetchResult<CreateTrackResponse>) => {
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors creating track:', result.errors);
          const currentTracks = this.tracksCache.getValue();
          const revertedTracks = [...currentTracks].filter(t => t.id !== tempId);
          this.tracksCache.next(revertedTracks);
          return Result.Error(TrackErrors.createError(
            'Failed to create track',
            { data, tempId }
          )) as Result<Track, TrackError>;
        }

        if (result.data == null) {
          const currentTracks = this.tracksCache.getValue();
          const revertedTracks = [...currentTracks].filter(t => t.id !== tempId);
          this.tracksCache.next(revertedTracks);
          return Result.Error(TrackErrors.createError(
            'No data received from GraphQL',
            { data, tempId }
          )) as Result<Track, TrackError>;
        }

        const createdTrack = result.data.createTrack;
        const currentTracks = this.tracksCache.getValue();
        const updatedTracks = [...currentTracks].map(t =>
          t.id === tempId ? createdTrack : t
        );
        this.tracksCache.next(updatedTracks);
        return Result.Ok(createdTrack) as Result<Track, TrackError>;
      }),
      catchError(error => {
        console.error('Network error creating track:', error);
        const currentTracks = this.tracksCache.getValue();
        const revertedTracks = [...currentTracks].filter(t => t.id !== tempId);
        this.tracksCache.next(revertedTracks);
        return of(Result.Error(TrackErrors.createError(
          'Network error while creating track',
          { error, data, tempId }
        )));
      })
    );
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Result<Track, TrackError>> {
    return this.apollo.mutate<UpdateTrackResponse>({
      mutation: UPDATE_TRACK,
      variables: { id, input: data }
    }).pipe(
      map((result: FetchResult<UpdateTrackResponse>) => {
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors updating track:', result.errors);
          return Result.Error(TrackErrors.updateError(
            'Failed to update track',
            { id, data }
          )) as Result<Track, TrackError>;
        }

        if (result.data == null) {
          return Result.Error(TrackErrors.updateError(
            'No data received from GraphQL',
            { id, data }
          )) as Result<Track, TrackError>;
        }

        return Result.Ok(result.data.updateTrack) as Result<Track, TrackError>;
      }),
      catchError(error => {
        console.error('Network error updating track:', error);
        return of(Result.Error(TrackErrors.updateError(
          'Network error while updating track',
          { error, id, data }
        )));
      })
    );
  }

  public deleteTrack(id: string): Observable<Result<null, TrackError>> {
    return this.apollo.mutate<DeleteTrackResponse>({
      mutation: DELETE_TRACK,
      variables: { id }
    }).pipe(
      map((result: FetchResult<DeleteTrackResponse>) => {
        if ((result.errors != null && result.errors.length > 0) || result.data?.deleteTrack !== true) {
          console.error('GraphQL errors deleting track:', result.errors);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete track',
            { id }
          )) as Result<null, TrackError>;
        }

        return Result.Ok(null) as Result<null, TrackError>;
      }),
      catchError(error => {
        console.error('Network error deleting track:', error);
        return of(Result.Error(TrackErrors.deleteError(
          'Network error while deleting track',
          { error, id }
        )));
      })
    );
  }

  public deleteTracks(ids: string[]): Observable<Result<BulkDeleteResponse, TrackError>> {
    return this.apollo.mutate<DeleteTracksResponse>({
      mutation: DELETE_TRACKS,
      variables: { ids }
    }).pipe(
      map((result: FetchResult<DeleteTracksResponse>) => {
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors deleting tracks:', result.errors);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete tracks',
            { ids, count: ids.length }
          )) as Result<BulkDeleteResponse, TrackError>;
        }

        if (result.data == null) {
          return Result.Error(TrackErrors.deleteError(
            'No data received from GraphQL',
            { ids, count: ids.length }
          )) as Result<BulkDeleteResponse, TrackError>;
        }

        const response: BulkDeleteResponse = {
          success: result.data.deleteTracks.successIds,
          failed: result.data.deleteTracks.failedIds
        };

        return Result.Ok(response) as Result<BulkDeleteResponse, TrackError>;
      }),
      catchError(error => {
        console.error('Network error deleting tracks:', error);
        return of(Result.Error(TrackErrors.deleteError(
          'Network error while deleting tracks',
          { error, ids, count: ids.length }
        )));
      })
    );
  }

  public uploadFile(id: string, file: File): Observable<Result<Track, TrackError>> {
    return this.apollo.mutate<UploadTrackFileResponse>({
      mutation: UPLOAD_TRACK_FILE,
      variables: { id, file }
    }).pipe(
      map((result: FetchResult<UploadTrackFileResponse>) => {
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors uploading file:', result.errors);
          return Result.Error(TrackErrors.uploadError(
            'Failed to upload file',
            { id, fileName: file.name }
          )) as Result<Track, TrackError>;
        }

        if (result.data == null) {
          return Result.Error(TrackErrors.uploadError(
            'No data received from GraphQL',
            { id, fileName: file.name }
          )) as Result<Track, TrackError>;
        }

        return Result.Ok(result.data.uploadTrackFile) as Result<Track, TrackError>;
      }),
      catchError(error => {
        console.error('Network error uploading file:', error);
        return of(Result.Error(TrackErrors.uploadError(
          'Network error while uploading file',
          { error, id, fileName: file.name }
        )));
      })
    );
  }

  public deleteFile(id: string): Observable<Result<Track, TrackError>> {
    return this.apollo.mutate<DeleteTrackFileResponse>({
      mutation: DELETE_TRACK_FILE,
      variables: { id }
    }).pipe(
      map((result: FetchResult<DeleteTrackFileResponse>) => {
        if (result.errors != null && result.errors.length > 0) {
          console.error('GraphQL errors deleting file:', result.errors);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete file',
            { id }
          )) as Result<Track, TrackError>;
        }

        if (result.data == null) {
          return Result.Error(TrackErrors.deleteError(
            'No data received from GraphQL',
            { id }
          )) as Result<Track, TrackError>;
        }

        return Result.Ok(result.data.deleteTrackFile) as Result<Track, TrackError>;
      }),
      catchError(error => {
        console.error('Network error deleting file:', error);
        return of(Result.Error(TrackErrors.deleteError(
          'Network error while deleting file',
          { error, id }
        )));
      })
    );
  }

  public getTracksCache(): Observable<Track[]> {
    return this.tracksCache.asObservable();
  }

  private generateSlug(title: string, id: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '')
      .replace(/\s+/g, '-') +
      '-' + id.substring(0, 8);
  }

  private mapSortField(sort: string): string {
    const fieldMap: Record<string, string> = {
      'title': 'TITLE',
      'artist': 'ARTIST',
      'album': 'ALBUM',
      'createdAt': 'CREATED_AT',
      'updatedAt': 'UPDATED_AT'
    };
    return fieldMap[sort] ?? 'CREATED_AT';
  }
}
