import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Subscription } from 'rxjs';
import { AudioPriorityService } from '../../audio-playback/model/audio-priority.service';
import { Track } from '@app/entities';
import { isDefined } from '@app/shared';

interface ActiveTrack {
  id: string;
  title: string;
  artist: string;
  audioFile?: string;
}

const ACTIVE_TRACK_SUBSCRIPTION = gql`
  subscription ActiveTrack {
    activeTrack {
      id
      title
      artist
      audioFile
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ActiveTrackService implements OnDestroy {
  private readonly apollo = inject(Apollo);
  private readonly audioPriority = inject(AudioPriorityService);
  private subscription?: Subscription;

  public activeTrack = signal<ActiveTrack | null>(null);

  constructor() {
    this.startSubscription();
  }

  private startSubscription(): void {
    this.subscription = this.apollo
      .subscribe<{ activeTrack: ActiveTrack | null }>({
        query: ACTIVE_TRACK_SUBSCRIPTION
      })
      .subscribe({
        next: ({ data }) => {
          console.log('Active track update:', data?.activeTrack);
          const newActiveTrack = data?.activeTrack ?? null;
          this.activeTrack.set(newActiveTrack);

          if (isDefined(newActiveTrack?.audioFile)) {
            const track: Track = {
              id: newActiveTrack.id,
              title: newActiveTrack.title,
              artist: newActiveTrack.artist,
              audioFile: newActiveTrack.audioFile,
              genres: [],
              slug: '',
              createdAt: '',
              updatedAt: ''
            };
            this.audioPriority.setActiveTrack(track);
          } else {
            this.audioPriority.setActiveTrack(null);
          }
        },
        error: (error) => {
          console.error('Subscription error:', error);
          setTimeout(() => { this.startSubscription(); }, 10000);
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
