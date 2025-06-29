import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
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
    const input: any = {};

    // Фильтрация
    if (search || genre || artist) {
      input.filter = {};
      if (search) input.filter.search = search;
      if (genre) input.filter.genre = genre;
      if (artist) input.filter.artist = artist;
    }

    // Сортировка
    if (sort) {
      const sortField = this.mapSortField(sort);
      input.sort = {
        field: sortField,
        order: order?.toUpperCase() || 'DESC'
      };
    }

    // Пагинация
    if (page || limit) {
      input.pagination = {
        page: page || 1,
        limit: limit || 10
      };
    }

    return this.apollo.watchQuery({
      query: GET_TRACKS,
      variables: { input }
    }).valueChanges.pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors loading tracks:', result.errors);
          return Result.Error(TrackErrors.fetchError(
            'Failed to fetch tracks',
            { params }
          )) as Result<PaginatedTracksResponse, TrackError>;
        }

        const response: PaginatedTracksResponse = {
          data: result.data.tracks.data,
          meta: result.data.tracks.pageInfo
        };

        this.tracksCache.next(response.data);
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
    return this.apollo.watchQuery({
      query: GET_TRACK_BY_SLUG,
      variables: { slug }
    }).valueChanges.pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors loading track:', result.errors);
          return Result.Error(TrackErrors.notFoundError(slug)) as Result<Track, TrackError>;
        }

        if (!result.data.trackBySlug) {
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
    this.tracksCache.next([optimisticTrack, ...currentTracks]);

    return this.apollo.mutate({
      mutation: CREATE_TRACK,
      variables: { input: data }
    }).pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors creating track:', result.errors);
          const revertedTracks = this.tracksCache.getValue().filter(t => t.id !== tempId);
          this.tracksCache.next(revertedTracks);
          return Result.Error(TrackErrors.createError(
            'Failed to create track',
            { data, tempId }
          )) as Result<Track, TrackError>;
        }

        const createdTrack = result.data.createTrack;
        const updatedTracks = this.tracksCache.getValue().map(t =>
          t.id === tempId ? createdTrack : t
        );
        this.tracksCache.next(updatedTracks);
        return Result.Ok(createdTrack) as Result<Track, TrackError>;
      }),
      catchError(error => {
        console.error('Network error creating track:', error);
        const revertedTracks = this.tracksCache.getValue().filter(t => t.id !== tempId);
        this.tracksCache.next(revertedTracks);
        return of(Result.Error(TrackErrors.createError(
          'Network error while creating track',
          { error, data, tempId }
        )));
      })
    );
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Result<Track, TrackError>> {
    return this.apollo.mutate({
      mutation: UPDATE_TRACK,
      variables: { id, input: data }
    }).pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors updating track:', result.errors);
          return Result.Error(TrackErrors.updateError(
            'Failed to update track',
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
    return this.apollo.mutate({
      mutation: DELETE_TRACK,
      variables: { id }
    }).pipe(
      map((result: any) => {
        if (result.errors || !result.data?.deleteTrack) {
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
    return this.apollo.mutate({
      mutation: DELETE_TRACKS,
      variables: { ids }
    }).pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors deleting tracks:', result.errors);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete tracks',
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
    return this.apollo.mutate({
      mutation: UPLOAD_TRACK_FILE,
      variables: { id, file }
    }).pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors uploading file:', result.errors);
          return Result.Error(TrackErrors.uploadError(
            'Failed to upload file',
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
    return this.apollo.mutate({
      mutation: DELETE_TRACK_FILE,
      variables: { id }
    }).pipe(
      map((result: any) => {
        if (result.errors) {
          console.error('GraphQL errors deleting file:', result.errors);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete file',
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
    return fieldMap[sort] || 'CREATED_AT';
  }
}
