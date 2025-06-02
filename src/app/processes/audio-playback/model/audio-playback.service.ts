import { inject, Injectable } from '@angular/core';
import { Track } from '@app/entities';
import { BehaviorSubject } from 'rxjs';
import { Result, ok, err, fromPromise } from 'neverthrow';
import { ApiConfigService, safeExecute, UnknownError, isDefined } from '@app/shared';

export interface AudioState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AudioPlaybackService {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaybackInProgress = false;

  private audioStateSubject = new BehaviorSubject<AudioState>({
    track: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null,
  });
  private apiConfig = inject(ApiConfigService);

  public audioState$ = this.audioStateSubject.asObservable();

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    if (isDefined(this.audioElement)) {
      const cleanupResult = this.cleanupAudioElement();
      if (cleanupResult.isErr()) {
        console.warn('Failed to cleanup audio element:', cleanupResult.error.message);
      }
    }

    this.audioElement = new Audio();

    this.audioElement.addEventListener('timeupdate', () => { this.handleTimeUpdate(); });
    this.audioElement.addEventListener('ended', () => { this.handleEnded(); });
    this.audioElement.addEventListener('loadedmetadata', () => { this.handleLoaded(); });
    this.audioElement.addEventListener('error', (event) => { this.handleError(event); });
    this.audioElement.addEventListener('canplay', () => { this.handleCanPlay(); });
    this.audioElement.addEventListener('loadeddata', () => { this.handleLoadedData(); });
    this.audioElement.addEventListener('canplaythrough', () => { this.handleCanPlayThrough(); });

    const volumeResult = safeExecute(() => {
      return localStorage.getItem('audioVolume');
    })();

    if (volumeResult.isOk() && isDefined(volumeResult.value)) {
      const savedVolume = volumeResult.value;
      const parseVolumeResult = safeExecute(() => {
        return parseFloat(savedVolume);
      })();

      if (parseVolumeResult.isOk() && !isNaN(parseVolumeResult.value)) {
        this.audioElement.volume = parseVolumeResult.value;
        this.updateState({ volume: parseVolumeResult.value });
      }
    }
  }

  private handleTimeUpdate(): void {
    if (!isDefined(this.audioElement)) return;
    this.updateState({ currentTime: this.audioElement.currentTime });
  }

  private handleEnded(): void {
    this.updateState({ isPlaying: false, currentTime: 0 });
  }

  private handleLoaded(): void {
    if (!isDefined(this.audioElement)) return;
    this.updateState({ duration: this.audioElement.duration });
  }

  private handleError(event: Event): void {
    let errorMessage = 'Неизвестная ошибка аудио';

    if (isDefined(this.audioElement?.error)) {
      const mediaError = this.audioElement.error;
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Воспроизведение прервано пользователем';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Сетевая ошибка при загрузке аудио';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Ошибка декодирования аудио';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Формат аудио не поддерживается';
          break;
        default:
          errorMessage = `Ошибка аудио (код ${String(mediaError.code)})`;
      }
      console.warn(`Audio error: ${errorMessage}`, mediaError);
    } else {
      console.warn('Audio error without media error information', event);
    }

    this.updateState({
      isPlaying: false,
      error: errorMessage
    });
  }

  private handleCanPlay(): void {
    console.log('Audio can play event fired');
  }

  private handleLoadedData(): void {
    console.log('Audio loaded data event fired');
  }

  private handleCanPlayThrough(): void {
    console.log('Audio can play through event fired, starting playback');
    const state = this.audioStateSubject.value;
    if (isDefined(state.track) && this.isPlaybackInProgress) {
      void this.play();
    }
  }

  private cleanupAudioElement(): Result<void, UnknownError> {
    if (!isDefined(this.audioElement)) return ok(undefined);

    const pauseResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
    })();

    if (pauseResult.isErr()) {
      console.error('Error cleaning up audio element:', pauseResult.error.message);
      return pauseResult;
    }

    const loadResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.load();
      }
    })();

    if (loadResult.isErr()) {
      console.warn('Non-critical error when loading empty audio source:', loadResult.error.message);
    }

    return ok(undefined);
  }

  public playTrack(track: Track): void {
    if (!isDefined(track.audioFile) || track.audioFile === '') {
      this.updateState({
        error: 'Track has no audio file',
        isPlaying: false
      });
      console.error('Track has no audio file');
      return;
    }

    if (this.isPlaybackInProgress) {
      console.log('Playback already in progress, ignoring call');
      return;
    }

    this.isPlaybackInProgress = true;

    const stopResult = this.stop();
    if (stopResult.isErr()) {
      console.warn('Failed to stop current track:', stopResult.error.message);
    }

    this.initAudio();

    this.updateState({
      track,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    });

    const audioFileUrl = this.getFullAudioUrl(track.audioFile);
    console.log('Loading audio from URL:', audioFileUrl);

    if (isDefined(this.audioElement)) {
      this.updateState({ error: null });

      const setupResult = safeExecute(() => {
        if (isDefined(this.audioElement)) {
          this.audioElement.src = audioFileUrl;
          this.audioElement.load();

          this.audioElement.oncanplaythrough = () => {
            console.log('Audio can play through event fired, starting playback');
            void this.play();
            if (isDefined(this.audioElement)) {
              this.audioElement.oncanplaythrough = null;
            }
          };
        }
      })();

      if (setupResult.isErr()) {
        console.error('Error setting audio source:', setupResult.error.message);
        this.updateState({
          error: 'Ошибка при установке источника аудио',
          isPlaying: false
        });
        this.isPlaybackInProgress = false;
      }
    }

    setTimeout(() => {
      if (this.isPlaybackInProgress) {
        console.log('Playback flag reset after timeout');
        this.isPlaybackInProgress = false;
      }
    }, 5000);
  }

  public togglePlayPause(): void {
    if (!isDefined(this.audioElement) || !isDefined(this.audioStateSubject.value.track)) {
      return;
    }

    if (this.audioElement.readyState === 0) {
      console.error('Audio element is not loaded properly');
      this.updateState({
        error: 'Audio source is not loaded properly. Please try again.',
        isPlaying: false
      });
      return;
    }

    if (this.audioStateSubject.value.isPlaying) {
      this.pause();
    } else {
      void this.play();
    }
  }

  public async play(): Promise<void> {
    if (!isDefined(this.audioElement)) return;

    if (this.audioElement.src === '') {
      console.error('No audio source set');
      this.updateState({
        error: 'No audio source available',
        isPlaying: false
      });
      return;
    }

    this.updateState({ error: null });

    console.log('Attempting to play audio source:', this.audioElement.src);
    console.log('Audio element ready state:', this.audioElement.readyState);

    const playResult = await fromPromise(
      this.audioElement.play(),
      (error: unknown) => ({
        code: 'UNKNOWN_ERROR' as const,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    );

    if (playResult.isOk()) {
      console.log('Audio playback started successfully');
      this.updateState({ isPlaying: true });
      this.isPlaybackInProgress = false;
    } else {
      console.error('Error playing audio:', playResult.error.message);
      this.updateState({
        isPlaying: false,
        error: `Failed to play audio: ${playResult.error.message}`
      });
      this.isPlaybackInProgress = false;
    }
  }

  public pause(): void {
    if (!isDefined(this.audioElement)) return;

    this.audioElement.pause();
    this.updateState({ isPlaying: false });
  }

  public stop(): Result<void, UnknownError> {
    if (!isDefined(this.audioElement)) return ok(undefined);

    const stopResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
    })();

    if (stopResult.isErr()) {
      console.error('Error stopping audio:', stopResult.error.message);
      return stopResult;
    }

    const loadResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.load();
      }
    })();

    if (loadResult.isErr()) {
      console.warn('Non-critical error when loading empty audio source:', loadResult.error.message);
    }

    this.updateState({
      isPlaying: false,
      currentTime: 0,
      track: null,
      error: null
    });

    return ok(undefined);
  }

  public seek(time: number): Result<void, UnknownError> {
    if (!isDefined(this.audioElement)) return err({ code: 'UNKNOWN_ERROR', message: 'Audio element not available' });

    const seekResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.currentTime = time;
      }
    })();

    if (seekResult.isErr()) {
      console.error('Error seeking audio:', seekResult.error.message);
      this.updateState({
        error: 'Ошибка при перемотке аудио',
      });
      return seekResult;
    }

    this.updateState({ currentTime: time });
    return ok(undefined);
  }

  public setVolume(volume: number): Result<void, UnknownError> {
    if (!isDefined(this.audioElement)) return err({ code: 'UNKNOWN_ERROR', message: 'Audio element not available' });

    volume = Math.max(0, Math.min(1, volume));

    const volumeResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.volume = volume;
        localStorage.setItem('audioVolume', volume.toString());
      }
    })();

    if (volumeResult.isErr()) {
      console.error('Error setting volume:', volumeResult.error.message);
      return volumeResult;
    }

    this.updateState({ volume });
    return ok(undefined);
  }

  public getCurrentTrack(): Track | null {
    return this.audioStateSubject.value.track;
  }

  public isCurrentTrack(trackId: string): boolean {
    return this.audioStateSubject.value.track?.id === trackId;
  }

  public isPlaying(): boolean {
    return this.audioStateSubject.value.isPlaying;
  }

  private updateState(partialState: Partial<AudioState>): void {
    this.audioStateSubject.next({
      ...this.audioStateSubject.value,
      ...partialState
    });
  }

  private getFullAudioUrl(audioFilePath: string): string {
    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return audioFilePath;
    }
    return this.apiConfig.getUrl(`files/${audioFilePath}`);
  }

  public reset(): void {
    this.isPlaybackInProgress = false;
    const cleanupResult = this.cleanupAudioElement();
    if (cleanupResult.isErr()) {
      console.warn('Failed to cleanup audio element during reset:', cleanupResult.error.message);
    }

    this.initAudio();

    this.updateState({
      track: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    });

    console.log('Audio player has been completely reset');
  }
}
