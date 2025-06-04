import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, DestroyRef, ElementRef,
  EventEmitter, HostListener, inject,
  Input,
  OnDestroy,
  OnInit,
  Output, ViewChild
} from '@angular/core';
import { NgIf } from '@angular/common';
import WaveSurfer from 'wavesurfer.js';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Result, ok, err, fromPromise } from 'neverthrow';
import { AudioPlaybackService, AudioState } from '@app/processes';
import { ApiConfigService, TestIdDirective, safeExecute, UnknownError, assertDefined, isDefined, DomainErrorCode } from '@app/shared';
import { Track } from '@app/entities';

@Component({
  selector: 'app-track-player',
  standalone: true,
  imports: [
    TestIdDirective,
    NgIf,
    MatIconButton,
    MatIcon,
    MatProgressSpinner
  ],
  templateUrl: './track-player.component.html',
  styleUrl: './track-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() public track!: Track;
  @Output() public playerClose = new EventEmitter<void>();

  @ViewChild('waveformRef') waveformRef!: ElementRef;

  public audioState!: AudioState;
  public wavesurfer: WaveSurfer | null = null;
  public waveformReady = false;
  public dragging = false;
  private lastVolume = 0;
  private initializationInProgress = false;
  private componentDestroyed = false;
  private pendingPlayback = false;

  private destroyRef = inject(DestroyRef);
  private apiConfig = inject(ApiConfigService);
  private audioService = inject(AudioPlaybackService);
  private cdr = inject(ChangeDetectorRef);

  @HostListener('window:beforeunload')
  public beforeUnload(): void {
    if (this.audioState.isPlaying) {
      const stopResult = this.audioService.stop();
      if (stopResult.isErr()) {
        console.warn('Failed to stop audio on page unload:', stopResult.error.message);
      }
    }
  }

  public ngOnInit(): void {
    this.audioState = {
      track: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      error: null
    };

    this.audioService.audioState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        if (this.audioState.track === null || state.track?.id === this.track.id) {
          this.audioState = state;

          if (state.isPlaying && !this.waveformReady && state.track?.id === this.track.id) {
            console.log('Audio started playing but waveform is not ready yet, pausing temporarily');
            this.audioService.pause();
            this.pendingPlayback = true;
          }

          if (this.wavesurfer !== null && this.waveformReady && !this.dragging) {
            if (state.track?.id === this.track.id && state.duration > 0) {
              const seekResult = this.safeSeekWavesurfer(state.currentTime, state.duration);
              if (seekResult.isErr()) {
                console.error('Error seeking wavesurfer:', seekResult.error.message);
              }
            }
          }

          this.cdr.markForCheck();
        }
      });
  }

  private safeSeekWavesurfer(currentTime: number, duration: number): Result<void, UnknownError> {
    if (this.wavesurfer === null) {
      return err({ code: DomainErrorCode.UNKNOWN_ERROR, message: 'WaveSurfer not available' });
    }

    const seekResult = safeExecute(() => {
      const position = currentTime / Math.max(duration, 0.1);
      if (position >= 0 && position <= 1 && this.wavesurfer !== null) {
        this.wavesurfer.seekTo(position);
      }
    })();

    if (seekResult.isErr()) {
      return err({ code: DomainErrorCode.UNKNOWN_ERROR, message: seekResult.error.message });
    }

    return ok(undefined);
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      void this.initWaveSurfer();
    });
  }

  public ngOnDestroy(): void {
    this.componentDestroyed = true;
    this.destroyWaveSurfer();

    if (this.audioState.isPlaying && this.audioState.track?.id === this.track.id) {
      const stopResult = this.audioService.stop();
      if (stopResult.isErr()) {
        console.warn('Failed to stop audio on component destroy:', stopResult.error.message);
      }
    }
  }

  private destroyWaveSurfer(): Result<void, UnknownError> {
    if (isDefined(this.wavesurfer)) {
      const destroyResult = safeExecute(() => {
        if (isDefined(this.wavesurfer)) {
          this.wavesurfer.pause();
          this.wavesurfer.destroy();
        }
      })();

      if (destroyResult.isErr()) {
        console.error('Error destroying WaveSurfer instance:', destroyResult.error.message);
        return err({ code: DomainErrorCode.UNKNOWN_ERROR, message: 'Failed to destroy WaveSurfer' });
      }

      this.wavesurfer = null;
      this.waveformReady = false;
    }

    if (isDefined(this.waveformRef.nativeElement)) {
      const clearContainerResult = safeExecute(() => {
        const container = this.waveformRef.nativeElement as HTMLElement;
        while (isDefined(container.firstChild)) {
          container.removeChild(container.firstChild);
        }
      })();

      if (clearContainerResult.isErr()) {
        console.warn('Error clearing waveform container:', clearContainerResult.error.message);
        return err({ code: DomainErrorCode.UNKNOWN_ERROR, message: 'Failed to clear waveform container' });
      }
    }

    return ok(undefined);
  }

  private async initWaveSurfer(): Promise<void> {
    if (this.componentDestroyed) {
      console.log('WaveSurfer already initialized, skipping');
      return;
    }

    if (this.initializationInProgress) {
      console.log('Initialization of WaveSurfer is already in progress, skip it');
      return;
    }

    this.initializationInProgress = true;

    if (this.track.audioFile === undefined || this.track.audioFile === '') {
      console.error('Track has no audio file, cannot initialize wavesurfer');
      return;
    }

    if (this.waveformRef.nativeElement === null || this.waveformRef.nativeElement === undefined) {
      this.initializationInProgress = false;
      console.error('Waveform element reference is not available');
      return;
    }

    const waveformElement = this.waveformRef.nativeElement as HTMLElement;
    const destroyResult = this.destroyWaveSurfer();
    if (destroyResult.isErr()) {
      console.warn('Failed to destroy existing WaveSurfer:', destroyResult.error.message);
    }

    const audioFileUrl = this.getFullAudioUrl(this.track.audioFile);
    console.log('WaveSurfer loading from URL:', audioFileUrl);

    const setupResult = safeExecute(() => {
      const container = this.waveformRef.nativeElement as HTMLElement;
      while (container.firstChild !== null) {
        container.removeChild(container.firstChild);
      }

      this.wavesurfer = WaveSurfer.create({
        container: waveformElement,
        height: 80,
        waveColor: '#9e9e9e',
        progressColor: '#1976d2',
        cursorColor: '#f44336',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        fillParent: true,
        backend: 'WebAudio',
        hideScrollbar: true,
        interact: false,
      });

      return this.wavesurfer;
    })();

    if (setupResult.isErr()) {
      console.error('Error creating WaveSurfer:', setupResult.error.message);
      this.waveformReady = false;
      this.initializationInProgress = false;
      this.pendingPlayback = false;
      this.cdr.markForCheck();
      return;
    }

    const wavesurfer = setupResult.value;

    wavesurfer.on('ready', () => {
      console.log('WaveSurfer is ready');
      this.waveformReady = true;

      if (this.audioState.currentTime > 0 && this.audioState.duration > 0) {
        const position = this.audioState.currentTime / this.audioState.duration;
        wavesurfer.seekTo(position);
      }

      this.initializationInProgress = false;
      if (this.pendingPlayback) {
        console.log('Waveform is ready, resuming pending playback');
        this.pendingPlayback = false;
        setTimeout(() => {
          void this.audioService.play();
        }, 100);
      }

      this.cdr.markForCheck();
    });

    wavesurfer.on('error', error => {
      console.error('WaveSurfer error:', error);
      this.waveformReady = false;
      this.initializationInProgress = false;
      this.cdr.markForCheck();
    });

    wavesurfer.on('interaction', () => {
      this.dragging = true;
    });

    (wavesurfer as WaveSurfer & { on(event: 'seek', callback: (position: number) => void): void }).on('seek', (position: number) => {
      console.log('WaveSurfer seek event:', position);
      if (this.audioState.track?.id === this.track.id) {
        const seekTime = position * this.audioState.duration;
        const seekResult = this.audioService.seek(seekTime);
        if (seekResult.isErr()) {
          console.error('Failed to seek audio:', seekResult.error.message);
        }
      }

      setTimeout(() => {
        this.dragging = false;
      }, 100);
    });

    const loadResult = await fromPromise(
      wavesurfer.load(audioFileUrl),
      (error: unknown) => ({
        code: 'UNKNOWN_ERROR' as const,
        message: error instanceof Error ? error.message : 'Failed to load audio file'
      })
    );

    if (loadResult.isErr()) {
      console.error('Error loading audio file:', loadResult.error.message);
      this.waveformReady = false;
      this.initializationInProgress = false;
      this.pendingPlayback = false;
      this.cdr.markForCheck();
      return;
    }

    setTimeout(() => {
      if (!this.waveformReady && !this.componentDestroyed) {
        console.warn('WaveSurfer download timeout - possibly problems with downloading the audio file');
        this.initializationInProgress = false;
      }
    }, 10000);
  }

  public togglePlayPause(): void {
    if (!this.waveformReady) {
      console.log('Waveform not ready yet, setting pending playback');
      this.pendingPlayback = true;
      this.cdr.markForCheck();
      return;
    }

    if (this.audioState.track?.id !== this.track.id) {
      this.audioService.playTrack(this.track);
    } else {
      this.audioService.togglePlayPause();
    }
  }

  public onClosePlayer(): void {
    const stopResult = this.audioService.stop();
    if (stopResult.isErr()) {
      console.warn('Failed to stop audio when closing player:', stopResult.error.message);
    }

    const destroyResult = this.destroyWaveSurfer();
    if (destroyResult.isErr()) {
      console.warn('Failed to destroy WaveSurfer when closing player:', destroyResult.error.message);
    }

    this.playerClose.emit();
  }

  public formatTime(seconds: number): string {
    if (seconds === 0 || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins)}:${secs < 10 ? '0' : ''}${String(secs)}`;
  }

  public toggleMute(): void {
    if (this.audioState.volume > 0) {
      this.lastVolume = this.audioState.volume;
      const muteResult = this.audioService.setVolume(0);
      if (muteResult.isErr()) {
        console.error('Failed to mute audio:', muteResult.error.message);
      }
    } else {
      const volumeToRestore = this.lastVolume === 0 ? 0.7 : this.lastVolume;
      const unmuteResult = this.audioService.setVolume(volumeToRestore);
      if (unmuteResult.isErr()) {
        console.error('Failed to unmute audio:', unmuteResult.error.message);
      }
    }
  }

  public onVolumeChange(event: Event): void {
    assertDefined(event.target, 'Event target must be defined');
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    const volumeResult = this.audioService.setVolume(volume);

    if (volumeResult.isErr()) {
      console.error('Failed to change volume:', volumeResult.error.message);
      return;
    }

    if (volume > 0) {
      this.lastVolume = volume;
    }
  }

  public onTimelineClick(event: MouseEvent): void {
    if (this.audioState.duration === 0) return;

    assertDefined(event.currentTarget, 'Event currentTarget must be defined');
    const timeline = event.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const seekTime = ratio * this.audioState.duration;

    const seekResult = this.audioService.seek(seekTime);
    if (seekResult.isErr()) {
      console.error('Failed to seek via timeline:', seekResult.error.message);
    }
  }

  public get isPlaying(): boolean {
    return this.audioState.isPlaying && this.audioState.track?.id === this.track.id;
  }

  public get progressPercent(): number {
    if (this.audioState.duration === 0) return 0;
    return (this.audioState.currentTime / this.audioState.duration) * 100;
  }

  private getFullAudioUrl(audioFilePath: string): string {
    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return audioFilePath;
    }
    return this.apiConfig.getUrl(`files/${audioFilePath}`);
  }
}
