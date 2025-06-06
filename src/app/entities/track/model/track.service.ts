import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, switchMap } from 'rxjs';
import { isDefined, ValidatedTrackApiService } from '@app/shared';
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
  }): Observable<PaginatedTracksResponse> {
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
      switchMap(result => result.match(
        response => {
          this.tracksCache.next(response.data);
          return [response];
        },
        error => throwError(() => error)
      ))
    );
  }

  public getTrack(slug: string): Observable<Track> {
    return this.trackApi.getBySlug(slug).pipe(
      switchMap(result => result.match(
        track => [track],
        error => throwError(() => error)
      ))
    );
  }

  public createTrack(data: TrackCreate): Observable<Track> {
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
      switchMap(result => result.match(
        createdTrack => {
          const updatedTracks = this.tracksCache.getValue().map(t =>
            t.id === tempId ? createdTrack : t
          );
          this.tracksCache.next(updatedTracks);
          return [createdTrack];
        },
        error => {
          const revertedTracks = this.tracksCache.getValue().filter(t => t.id !== tempId);
          this.tracksCache.next(revertedTracks);
          return throwError(() => error);
        }
      ))
    );
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Track> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (trackToUpdate === undefined) {
      return this.trackApi.updateTrack(id, data).pipe(
        switchMap(result => result.match(
          track => [track],
          error => throwError(() => error)
        ))
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
      switchMap(result => result.match(
        updatedTrack => {
          const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
            t.id === id ? updatedTrack : t
          );
          this.tracksCache.next(serverUpdatedTracks);
          return [updatedTrack];
        },
        error => {
          this.tracksCache.next(currentTracks);
          return throwError(() => error);
        }
      ))
    );
  }

  public deleteTrack(id: string): Observable<null> {
    const currentTracks = this.tracksCache.getValue();

    const updatedTracks = currentTracks.filter(t => t.id !== id);
    this.tracksCache.next(updatedTracks);

    return this.trackApi.deleteTrack(id).pipe(
      switchMap(result => result.match(
        () => [null],
        error => {
          this.tracksCache.next(currentTracks);
          return throwError(() => error);
        }
      ))
    );
  }

  public deleteTracks(ids: string[]): Observable<BulkDeleteResponse> {
    const currentTracks = this.tracksCache.getValue();

    const updatedTracks = currentTracks.filter(t => !ids.includes(t.id));
    this.tracksCache.next(updatedTracks);

    return this.trackApi.deleteMany(ids).pipe(
      switchMap(result => result.match(
        response => {
          if (response.failed.length > 0) {
            const successfullyDeletedIds = response.success;
            const accurateTracks = currentTracks.filter(t => !successfullyDeletedIds.includes(t.id));
            this.tracksCache.next(accurateTracks);
          }
          return [response];
        },
        error => {
          this.tracksCache.next(currentTracks);
          return throwError(() => error);
        }
      ))
    );
  }

  public uploadFile(id: string, file: File): Observable<Track> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (trackToUpdate === undefined) {
      return this.trackApi.uploadFile(id, file).pipe(
        switchMap(result => result.match(
          track => [track],
          error => throwError(() => error)
        ))
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
      switchMap(result => result.match(
        updatedTrack => {
          const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
            t.id === id ? updatedTrack : t
          );
          this.tracksCache.next(serverUpdatedTracks);
          return [updatedTrack];
        },
        error => {
          this.tracksCache.next(currentTracks);
          return throwError(() => error);
        }
      ))
    );
  }

  public deleteFile(id: string): Observable<Track> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (trackToUpdate === undefined) {
      return this.trackApi.deleteFile(id).pipe(
        switchMap(result => result.match(
          track => [track],
          error => throwError(() => error)
        ))
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
      switchMap(result => result.match(
        updatedTrack => {
          const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
            t.id === id ? updatedTrack : t
          );
          this.tracksCache.next(serverUpdatedTracks);
          return [updatedTrack];
        },
        error => {
          this.tracksCache.next(currentTracks);
          return throwError(() => error);
        }
      ))
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
