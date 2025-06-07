import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import {
  isDefined,
  ValidatedTrackApiService,
  Result,
  TrackErrors,
  TrackError
} from '@app/shared';
import { BulkDeleteResponse, PaginatedTracksResponse, Track, TrackCreate, TrackUpdate } from './track';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  private tracksCache = new BehaviorSubject<Track[]>([]);

  private trackApi = inject(ValidatedTrackApiService);

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
    const filteredParams: typeof params = {};

    if (isDefined(page)) filteredParams.page = page;
    if (isDefined(limit)) filteredParams.limit = limit;
    if (isDefined(sort)) filteredParams.sort = sort;
    if (isDefined(order)) filteredParams.order = order;
    if (isDefined(search)) filteredParams.search = search;
    if (isDefined(genre)) filteredParams.genre = genre;
    if (isDefined(artist)) filteredParams.artist = artist;

    return this.trackApi.getAll(filteredParams).pipe(
      map(apiResult => Result.match(
        apiResult,
        (response: PaginatedTracksResponse) => {
          this.tracksCache.next(response.data);
          return Result.Ok(response) as Result<PaginatedTracksResponse, TrackError>;
        },
        () => Result.Error(TrackErrors.fetchError(
          'Failed to fetch tracks',
          { params: filteredParams }
        )) as Result<PaginatedTracksResponse, TrackError>
      )),
      catchError(error => of(Result.Error(TrackErrors.fetchError(
        'Network error while fetching tracks',
        { error, params: filteredParams }
      ))))
    );
  }

  public getTrack(slug: string): Observable<Result<Track, TrackError>> {
    return this.trackApi.getBySlug(slug).pipe(
      map(apiResult => Result.match(
        apiResult,
        (track: Track) => Result.Ok(track) as Result<Track, TrackError>,
        () => Result.Error(TrackErrors.notFoundError(slug)) as Result<Track, TrackError>
      )),
      catchError(error => of(Result.Error(TrackErrors.fetchError(
        `Network error while fetching track with slug: ${slug}`,
        { error, slug }
      ))))
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

    return this.trackApi.createTrack(data).pipe(
      map(apiResult => Result.match(
        apiResult,
        (createdTrack: Track) => {
          const updatedTracks = this.tracksCache.getValue().map(t =>
            t.id === tempId ? createdTrack : t
          );
          this.tracksCache.next(updatedTracks);
          return Result.Ok(createdTrack) as Result<Track, TrackError>;
        },
        () => {
          const revertedTracks = this.tracksCache.getValue().filter(t => t.id !== tempId);
          this.tracksCache.next(revertedTracks);
          return Result.Error(TrackErrors.createError(
            'Failed to create track',
            { data, tempId }
          )) as Result<Track, TrackError>;
        }
      )),
      catchError(error => {
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
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (trackToUpdate === undefined) {
      return this.trackApi.updateTrack(id, data).pipe(
        map(apiResult => Result.match(
          apiResult,
          (track: Track) => Result.Ok(track) as Result<Track, TrackError>,
          () => Result.Error(TrackErrors.notFoundError(id)) as Result<Track, TrackError>
        )),
        catchError(error => of(Result.Error(TrackErrors.updateError(
          `Network error while updating track with id: ${id}`,
          { error, id, data }
        ))))
      );
    }

    const { title, genres, artist, coverImage, album } = data;

    const optimisticTrack: Track = {
      ...trackToUpdate,
      ...(isDefined(title) && { title }),
      ...(isDefined(artist) && { artist }),
      ...(isDefined(album) && { album }),
      ...(isDefined(genres) && { genres }),
      ...(isDefined(coverImage) && { coverImage }),
      updatedAt: new Date().toISOString()
    };

    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    return this.trackApi.updateTrack(id, data).pipe(
      map(apiResult => Result.match(
        apiResult,
        (updatedTrack: Track) => {
          const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
            t.id === id ? updatedTrack : t
          );
          this.tracksCache.next(serverUpdatedTracks);
          return Result.Ok(updatedTrack) as Result<Track, TrackError>;
        },
        () => {
          this.tracksCache.next(currentTracks);
          return Result.Error(TrackErrors.updateError(
            'Failed to update track',
            { id, data }
          )) as Result<Track, TrackError>;
        }
      )),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return of(Result.Error(TrackErrors.updateError(
          'Network error while updating track',
          { error, id, data }
        )));
      })
    );
  }

  public deleteTrack(id: string): Observable<Result<null, TrackError>> {
    const currentTracks = this.tracksCache.getValue();

    const updatedTracks = currentTracks.filter(t => t.id !== id);
    this.tracksCache.next(updatedTracks);

    return this.trackApi.deleteTrack(id).pipe(
      map(apiResult => Result.match(
        apiResult,
        () => Result.Ok(null) as Result<null, TrackError>,
        () => {
          this.tracksCache.next(currentTracks);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete track',
            { id }
          )) as Result<null, TrackError>;
        }
      )),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return of(Result.Error(TrackErrors.deleteError(
          'Network error while deleting track',
          { error, id }
        )));
      })
    );
  }

  public deleteTracks(ids: string[]): Observable<Result<BulkDeleteResponse, TrackError>> {
    const currentTracks = this.tracksCache.getValue();

    const updatedTracks = currentTracks.filter(t => !ids.includes(t.id));
    this.tracksCache.next(updatedTracks);

    return this.trackApi.deleteMany(ids).pipe(
      map(apiResult => Result.match(
        apiResult,
        (response: BulkDeleteResponse) => {
          if (response.failed.length > 0) {
            const successfullyDeletedIds = response.success;
            const accurateTracks = currentTracks.filter(t => !successfullyDeletedIds.includes(t.id));
            this.tracksCache.next(accurateTracks);
          }
          return Result.Ok(response) as Result<BulkDeleteResponse, TrackError>;
        },
        () => {
          this.tracksCache.next(currentTracks);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete tracks',
            { ids, count: ids.length }
          )) as Result<BulkDeleteResponse, TrackError>;
        }
      )),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return of(Result.Error(TrackErrors.deleteError(
          'Network error while deleting tracks',
          { error, ids, count: ids.length }
        )));
      })
    );
  }

  public uploadFile(id: string, file: File): Observable<Result<Track, TrackError>> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (trackToUpdate === undefined) {
      return this.trackApi.uploadFile(id, file).pipe(
        map(apiResult => Result.match(
          apiResult,
          (track: Track) => Result.Ok(track) as Result<Track, TrackError>,
          () => Result.Error(TrackErrors.notFoundError(id)) as Result<Track, TrackError>
        )),
        catchError(error => of(Result.Error(TrackErrors.uploadError(
          `Network error while uploading file for track with id: ${id}`,
          { error, id, fileName: file.name }
        ))))
      );
    }

    const optimisticFileName = file.name;

    const optimisticTrack: Track = {
      ...trackToUpdate,
      audioFile: optimisticFileName,
      updatedAt: new Date().toISOString()
    };

    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    return this.trackApi.uploadFile(id, file).pipe(
      map(apiResult => Result.match(
        apiResult,
        (updatedTrack: Track) => {
          const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
            t.id === id ? updatedTrack : t
          );
          this.tracksCache.next(serverUpdatedTracks);
          return Result.Ok(updatedTrack) as Result<Track, TrackError>;
        },
        () => {
          this.tracksCache.next(currentTracks);
          return Result.Error(TrackErrors.uploadError(
            'Failed to upload file',
            { id, fileName: file.name }
          )) as Result<Track, TrackError>;
        }
      )),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return of(Result.Error(TrackErrors.uploadError(
          'Network error while uploading file',
          { error, id, fileName: file.name }
        )));
      })
    );
  }

  public deleteFile(id: string): Observable<Result<Track, TrackError>> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (trackToUpdate === undefined) {
      return this.trackApi.deleteFile(id).pipe(
        map(apiResult => Result.match(
          apiResult,
          (track: Track) => Result.Ok(track) as Result<Track, TrackError>,
          () => Result.Error(TrackErrors.notFoundError(id)) as Result<Track, TrackError>
        )),
        catchError(error => of(Result.Error(TrackErrors.deleteError(
          `Network error while deleting file for track with id: ${id}`,
          { error, id }
        ))))
      );
    }

    const optimisticTrack: Track = {
      ...trackToUpdate,
      audioFile: undefined,
      updatedAt: new Date().toISOString()
    };

    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    return this.trackApi.deleteFile(id).pipe(
      map(apiResult => Result.match(
        apiResult,
        (updatedTrack: Track) => {
          const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
            t.id === id ? updatedTrack : t
          );
          this.tracksCache.next(serverUpdatedTracks);
          return Result.Ok(updatedTrack) as Result<Track, TrackError>;
        },
        () => {
          this.tracksCache.next(currentTracks);
          return Result.Error(TrackErrors.deleteError(
            'Failed to delete file',
            { id }
          )) as Result<Track, TrackError>;
        }
      )),
      catchError(error => {
        this.tracksCache.next(currentTracks);
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
        .replace(/[^a-z0-9\s]/gi, '') // Only allow letters, numbers, and spaces
        .replace(/\s+/g, '-') +        // Replace spaces with dashes
      '-' + id.substring(0, 8);
  }
}
