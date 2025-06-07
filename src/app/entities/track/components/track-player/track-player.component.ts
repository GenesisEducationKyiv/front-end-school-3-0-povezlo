import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {NgIf} from '@angular/common';
import WaveSurfer from 'wavesurfer.js';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {AudioPlaybackService, AudioState} from '@app/processes';
import {
  ApiConfigService,
  assertDefined,
  createUnknownError,
  DomainError,
  isDefined,
  Result,
  TestIdDirective
} from '@app/shared';
import {Track} from '@app/entities';

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
      Result.match(
        stopResult,
        () => { /* no-op */ },
        (error: unknown) => {
          console.warn('Failed to stop audio on page unload:', error);
        }
      );
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

          if (isDefined(this.wavesurfer) && this.waveformReady && !this.dragging) {
            if (state.track?.id === this.track.id && state.duration > 0) {
              // Direct wavesurfer seek without Result wrapper
              const position = state.currentTime / Math.max(state.duration, 0.1);
              if (position >= 0 && position <= 1 && isDefined(this.wavesurfer)) {
                this.wavesurfer.seekTo(position);
              }
            }
          }

          this.cdr.markForCheck();
        }
      });
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
      Result.match(
        stopResult,
        () => { /* no-op */ },
        (error: unknown) => {
          console.warn('Failed to stop audio on component destroy:', error);
        }
      );
    }
  }

  private destroyWaveSurfer(): void {
    if (isDefined(this.wavesurfer)) {
      // Direct execution instead of safeExecute
      this.wavesurfer.pause();
      this.wavesurfer.destroy();
      this.wavesurfer = null;
      this.waveformReady = false;
    }

    if (isDefined(this.waveformRef.nativeElement)) {
      // Direct DOM manipulation
      const container = this.waveformRef.nativeElement as HTMLElement;
      while (isDefined(container.firstChild)) {
        container.removeChild(container.firstChild);
      }
    }
  }

  private async initWaveSurfer(): Promise<void> {
    if (this.componentDestroyed) {
      console.log('Component destroyed, skipping WaveSurfer initialization');
      return;
    }

    if (this.initializationInProgress) {
      console.log('Initialization of WaveSurfer is already in progress, skipping');
      return;
    }

    this.initializationInProgress = true;

    if (!isDefined(this.track.audioFile) || this.track.audioFile === '') {
      console.error('Track has no audio file, cannot initialize wavesurfer');
      this.initializationInProgress = false;
      return;
    }

    if (this.waveformRef.nativeElement === null || this.waveformRef.nativeElement === undefined) {
      this.initializationInProgress = false;
      console.error('Waveform element reference is not available');
      return;
    }

    const waveformElement = this.waveformRef.nativeElement as HTMLElement;
    this.destroyWaveSurfer();

    const audioFileUrl = this.getFullAudioUrl(this.track.audioFile);
    console.log('WaveSurfer loading from URL:', audioFileUrl);

        // Create WaveSurfer using Result monads
    const setupResult = this.createWaveSurfer(waveformElement);

    Result.match(
      setupResult,
      (ws: WaveSurfer) => {
        this.wavesurfer = ws;
      },
      (error) => {
        console.error('Error creating WaveSurfer:', error);
        this.waveformReady = false;
        this.initializationInProgress = false;
        this.pendingPlayback = false;
        this.cdr.markForCheck();
        return;
      }
    );

    if (!isDefined(this.wavesurfer)) {
      return;
    }

    const wavesurferInstance = this.wavesurfer;

    wavesurferInstance.on('ready', () => {
      console.log('WaveSurfer is ready');
      this.waveformReady = true;

      if (this.audioState.currentTime > 0 && this.audioState.duration > 0) {
        const position = this.audioState.currentTime / this.audioState.duration;
        wavesurferInstance.seekTo(position);
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

    wavesurferInstance.on('error', (error: unknown) => {
      console.error('WaveSurfer error:', error);
      this.waveformReady = false;
      this.initializationInProgress = false;
      this.cdr.markForCheck();
    });

    wavesurferInstance.on('interaction', () => {
      this.dragging = true;
    });

    (wavesurferInstance as WaveSurfer & { on(event: 'seek', callback: (position: number) => void): void }).on('seek', (position: number) => {
      console.log('WaveSurfer seek event:', position);
      if (this.audioState.track?.id === this.track.id) {
        const seekTime = position * this.audioState.duration;
        const seekResult = this.audioService.seek(seekTime);
        Result.match(
          seekResult,
          () => { /* no-op */ },
          (error: unknown) => {
            console.error('Failed to seek audio:', error);
          }
        );
      }

      setTimeout(() => {
        this.dragging = false;
      }, 100);
    });

    // Load audio file using Result monads
    const loadResult = await this.loadAudioFile(wavesurferInstance, audioFileUrl);
    Result.match(
      loadResult,
      () => { /* no-op */ },
      (error) => {
        console.error('Error loading audio file:', error);
        this.waveformReady = false;
        this.initializationInProgress = false;
        this.pendingPlayback = false;
        this.cdr.markForCheck();
        return;
      }
    );

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
    Result.match(
      stopResult,
      () => { /* no-op */ },
      (error: unknown) => {
        console.warn('Failed to stop audio when closing player:', error);
      }
    );

    this.destroyWaveSurfer();
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
      Result.match(
        muteResult,
        () => { /* no-op */ },
        (error: unknown) => {
          console.error('Failed to mute audio:', error);
        }
      );
    } else {
      const volumeToRestore = this.lastVolume === 0 ? 0.7 : this.lastVolume;
      const unmuteResult = this.audioService.setVolume(volumeToRestore);
      Result.match(
        unmuteResult,
        () => { /* no-op */ },
        (error: unknown) => {
          console.error('Failed to unmute audio:', error);
        }
      );
    }
  }

  public onVolumeChange(event: Event): void {
    assertDefined(event.target, 'Event target must be defined');
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    const volumeResult = this.audioService.setVolume(volume);

    Result.match(
      volumeResult,
      () => {
        if (volume > 0) {
          this.lastVolume = volume;
        }
      },
      (error: unknown) => {
        console.error('Failed to change volume:', error);
      }
    );
  }

  public onTimelineClick(event: MouseEvent): void {
    if (this.audioState.duration === 0) return;

    assertDefined(event.currentTarget, 'Event currentTarget must be defined');
    const timeline = event.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const seekTime = ratio * this.audioState.duration;

    const seekResult = this.audioService.seek(seekTime);
    Result.match(
      seekResult,
      () => { /* no-op */ },
      (error: unknown) => {
        console.error('Failed to seek via timeline:', error);
      }
    );
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

    private createWaveSurfer(waveformElement: HTMLElement): Result<WaveSurfer, DomainError> {
    // Clear container
    const container = this.waveformRef.nativeElement as HTMLElement;
    while (isDefined(container.firstChild)) {
      container.removeChild(container.firstChild);
    }

    // Create WaveSurfer instance with Result monads
    const waveSurfer = WaveSurfer.create({
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

    return Result.Ok(waveSurfer);
  }

  private async loadAudioFile(wavesurfer: WaveSurfer, audioFileUrl: string): Promise<Result<void, DomainError>> {
    return await wavesurfer.load(audioFileUrl).then(
      () => Result.Ok(undefined),
      (error: unknown) => Result.Error(createUnknownError(
        error instanceof Error ? error.message : 'Failed to load audio file',
        {originalError: error}
      ))
    );
  }
}
