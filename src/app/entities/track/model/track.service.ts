import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { TrackApiService } from '../../../shared';
import { BulkDeleteResponse, PaginatedTracksResponse, Track, TrackCreate, TrackUpdate } from './track';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  private tracksCache = new BehaviorSubject<Track[]>([]);

  private trackApi = inject(TrackApiService);

  public getTracks(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    genre?: string;
    artist?: string;
  }): Observable<PaginatedTracksResponse> {
    return this.trackApi.getAll(params).pipe(
      tap(response => {
        this.tracksCache.next(response.data);
      })
    );
  }

  public getTrack(slug: string): Observable<Track> {
    return this.trackApi.getBySlug(slug);
  }

  public createTrack(data: TrackCreate): Observable<Track> {
    const tempId = 'temp-' + new Date().getTime();

    const optimisticTrack: Track = {
      id: tempId,
      title: data.title,
      artist: data.artist,
      album: data.album || undefined,
      genres: data.genres,
      slug: this.generateSlug(data.title, tempId),
      coverImage: data.coverImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentTracks = this.tracksCache.getValue();
    this.tracksCache.next([optimisticTrack, ...currentTracks]);

    return this.trackApi.create(data).pipe(
      tap(createdTrack => {
        const updatedTracks = this.tracksCache.getValue().map(t =>
          t.id === tempId ? createdTrack : t
        );
        this.tracksCache.next(updatedTracks);
      }),
      catchError(error => {
        const revertedTracks = this.tracksCache.getValue().filter(t => t.id !== tempId);
        this.tracksCache.next(revertedTracks);
        return throwError(() => error);
      })
    );
  }

  public updateTrack(id: string, data: TrackUpdate): Observable<Track> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (!trackToUpdate) {
      return this.trackApi.update(id, data);
    }

    const optimisticTrack: Track = {
      ...trackToUpdate,
      ...data,
      updatedAt: new Date().toISOString()
    };

    const updatedTracks = currentTracks.map(t =>
      t.id === id ? optimisticTrack : t
    );
    this.tracksCache.next(updatedTracks);

    return this.trackApi.update(id, data).pipe(
      tap(updatedTrack => {
        const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
          t.id === id ? updatedTrack : t
        );
        this.tracksCache.next(serverUpdatedTracks);
      }),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public deleteTrack(id: string): Observable<void> {
    const currentTracks = this.tracksCache.getValue();

    const updatedTracks = currentTracks.filter(t => t.id !== id);
    this.tracksCache.next(updatedTracks);

    return this.trackApi.delete(id).pipe(
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public deleteTracks(ids: string[]): Observable<BulkDeleteResponse> {
    const currentTracks = this.tracksCache.getValue();

    const updatedTracks = currentTracks.filter(t => !ids.includes(t.id));
    this.tracksCache.next(updatedTracks);

    return this.trackApi.deleteMany(ids).pipe(
      tap(response => {
        if (response.failed.length > 0) {
          const successfullyDeletedIds = response.success;

          const accurateTracks = currentTracks.filter(t => !successfullyDeletedIds.includes(t.id));
          this.tracksCache.next(accurateTracks);
        }
      }),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public uploadFile(id: string, file: File): Observable<Track> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (!trackToUpdate) {
      return this.trackApi.uploadFile(id, file);
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
      tap(updatedTrack => {
        const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
          t.id === id ? updatedTrack : t
        );
        this.tracksCache.next(serverUpdatedTracks);
      }),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public deleteFile(id: string): Observable<Track> {
    const currentTracks = this.tracksCache.getValue();
    const trackToUpdate = currentTracks.find(t => t.id === id);

    if (!trackToUpdate) {
      return this.trackApi.deleteFile(id);
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
      tap(updatedTrack => {
        const serverUpdatedTracks = this.tracksCache.getValue().map(t =>
          t.id === id ? updatedTrack : t
        );
        this.tracksCache.next(serverUpdatedTracks);
      }),
      catchError(error => {
        this.tracksCache.next(currentTracks);
        return throwError(() => error);
      })
    );
  }

  public getTracksCache(): Observable<Track[]> {
    return this.tracksCache.asObservable();
  }

  private generateSlug(title: string, id: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-') +
      '-' + id.substring(0, 8);
  }
}
