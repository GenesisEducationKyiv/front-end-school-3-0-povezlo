import { Component, inject, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActiveTrackService } from '../../processes/active-track/model/active-track.service';
import { AudioPlaybackService, AudioState } from '../../processes/audio-playback/model/audio-playback.service';
import { AudioPriorityService, AudioPriority } from '../../processes/audio-playback/model/audio-priority.service';
import { isDefined } from '@app/shared';

@Component({
  selector: 'app-active-track-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './active-track-widget.component.html',
  styleUrls: ['./active-track-widget.component.scss'],
})
export class ActiveTrackWidgetComponent {
  protected readonly activeTrackService = inject(ActiveTrackService);
  private readonly audioPlaybackService = inject(AudioPlaybackService);
  private readonly audioPriorityService = inject(AudioPriorityService);
  protected readonly AudioPriority = AudioPriority;

  protected audioState = toSignal<AudioState | undefined>(this.audioPlaybackService.audioState$);

  private readonly DEFAULT_AUDIO_STATE: AudioState = {
    track: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null,
  };

  protected priorityState = this.audioPriorityService.state;

  constructor() {
    effect(() => {
      const activeTrack = this.activeTrackService.activeTrack();
      const priorityState = this.priorityState();

      if (isDefined(activeTrack) &&
          isDefined(activeTrack.audioFile) &&
          activeTrack.audioFile.trim() !== '' &&
          priorityState.currentPriority === AudioPriority.ACTIVE_TRACK) {
        const track = {
          id: activeTrack.id,
          title: activeTrack.title,
          artist: activeTrack.artist,
          audioFile: activeTrack.audioFile,
          genres: [],
          slug: '',
          createdAt: '',
          updatedAt: ''
        };

        this.audioPlaybackService.playTrack(track);
      }
    }, { allowSignalWrites: true });
  }

  protected togglePlayback(): void {
    const priorityState = this.priorityState();

    if (priorityState.currentPriority === AudioPriority.ACTIVE_TRACK) {
      this.audioPlaybackService.togglePlayPause();
    }
  }

  protected canControlPlayback(): boolean {
    const priorityState = this.priorityState();
    const activeTrack = this.activeTrackService.activeTrack();
    const audioState = this.audioState() ?? this.DEFAULT_AUDIO_STATE;

    return priorityState.currentPriority === AudioPriority.ACTIVE_TRACK &&
           isDefined(activeTrack) &&
           isDefined(audioState.track) &&
           audioState.track.id === activeTrack.id;
  }

  protected isActiveTrackPlaying(): boolean {
    const priorityState = this.priorityState();
    const activeTrack = this.activeTrackService.activeTrack();
    const audioState = this.audioState() ?? this.DEFAULT_AUDIO_STATE;

    return priorityState.currentPriority === AudioPriority.ACTIVE_TRACK &&
           audioState.isPlaying &&
           isDefined(activeTrack) &&
           isDefined(audioState.track) &&
           audioState.track.id === activeTrack.id;
  }

  protected progressPercentage = computed(() => {
    const state = this.audioState() ?? this.DEFAULT_AUDIO_STATE;
    const duration = state.duration;
    const currentTime = state.currentTime;

    if (!isDefined(duration) || duration === 0) {
      return 0;
    }

    return (currentTime / duration) * 100;
  });

  protected formatTime(seconds: number): string {
    if (!isDefined(seconds) || isNaN(seconds)) {
      return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes)}:${String(remainingSeconds).padStart(2, '0')}`;
  }
}
