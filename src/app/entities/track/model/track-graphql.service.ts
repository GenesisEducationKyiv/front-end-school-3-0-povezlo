import { Injectable, inject } from '@angular/core';
import {
  GetTracksGQL,
  GetTracksQuery,
  CreateTrackGQL,
  CreateTrackMutation,
  UpdateTrackGQL,
  UpdateTrackMutation,
  DeleteTrackGQL,
  DeleteTracksGQL,
  TracksInput,
  TrackCreateInput,
  TrackUpdateInput,
  Track,
  BulkDeleteTracksMutation,
  UploadTrackFileGQL,
  DeleteTrackFileGQL
} from '@shared/graphql/generated';
// Apollo import removed
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrackGraphQLService {
  private readonly getTracksGQL = inject(GetTracksGQL);
  private readonly createTrackGQL = inject(CreateTrackGQL);
  private readonly updateTrackGQL = inject(UpdateTrackGQL);
  private readonly deleteTrackGQL = inject(DeleteTrackGQL);
  private readonly deleteTracksGQL = inject(DeleteTracksGQL);
  private readonly uploadTrackFileGQL = inject(UploadTrackFileGQL);
  private readonly deleteTrackFileGQL = inject(DeleteTrackFileGQL);

  /** Получить список треков */
  getTracks(input?: TracksInput): Observable<GetTracksQuery['tracks']> {
    return this.getTracksGQL
      .watch({ input } as { input?: TracksInput }, { fetchPolicy: 'network-only' })
      .valueChanges.pipe(map(result => result.data.tracks));
  }

  /** Создать трек */
  createTrack(input: TrackCreateInput): Observable<CreateTrackMutation['createTrack']> {
    return this.createTrackGQL
      .mutate({ input })
      .pipe(map(result => {
        if (result.data == null) {
          throw new Error('No data');
        }
        return result.data.createTrack;
      }));
  }

  /** Обновить трек */
  updateTrack(id: string, input: TrackUpdateInput): Observable<UpdateTrackMutation['updateTrack']> {
    return this.updateTrackGQL
      .mutate({ id, input })
      .pipe(map(result => {
        if (result.data == null) {
          throw new Error('No data');
        }
        return result.data.updateTrack;
      }));
  }

  /** Удалить трек */
  deleteTrack(id: string): Observable<boolean> {
    return this.deleteTrackGQL
      .mutate({ id })
      .pipe(map(result => (result.data == null ? false : result.data.deleteTrack)));
  }

  /** Удалить несколько треков */
  deleteTracks(ids: string[]): Observable<BulkDeleteTracksMutation['deleteTracks']> {
    return this.deleteTracksGQL.mutate({ ids }).pipe(
      map(result => {
        if (result.data == null) {
          throw new Error('No data');
        }
        return result.data.deleteTracks;
      })
    );
  }

  /** Загрузить аудиофайл */
  uploadFile(id: string, file: File): Observable<Track> {
    return this.uploadTrackFileGQL.mutate({ id, file }, {
      context: {
        useMultipart: true
      }
    }).pipe(map(result => {
      if (result.data == null) {
        throw new Error('No data');
      }
      return result.data.uploadTrackFile;
    }));
  }

  /** Удалить аудиофайл */
  deleteFile(id: string): Observable<Track> {
    return this.deleteTrackFileGQL.mutate({ id }).pipe(
      map(result => {
        if (result.data == null) {
          throw new Error('No data');
        }
        return result.data.deleteTrackFile;
      })
    );
  }
}
