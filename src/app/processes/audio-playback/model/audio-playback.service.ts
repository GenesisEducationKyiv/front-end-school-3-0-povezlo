import { inject, Injectable } from '@angular/core';
import { Track } from '@app/entities';
import { BehaviorSubject } from 'rxjs';
import {
  ApiConfigService,
  isDefined,
  ErrorHandlingService,
  createValidationError,
  createUnknownError,
  DomainError,
  ValidationError,
  Result
} from '@app/shared';

export enum AudioErrorCode {
  MEDIA_ERR_ABORTED = 'MEDIA_ERR_ABORTED',
  MEDIA_ERR_NETWORK = 'MEDIA_ERR_NETWORK',
  MEDIA_ERR_DECODE = 'MEDIA_ERR_DECODE',
  MEDIA_ERR_SRC_NOT_SUPPORTED = 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  AUDIO_NOT_AVAILABLE = 'AUDIO_NOT_AVAILABLE',
  INVALID_TRACK = 'INVALID_TRACK',
  PLAYBACK_FAILED = 'PLAYBACK_FAILED'
}

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
  private errorHandler = inject(ErrorHandlingService);

  public audioState$ = this.audioStateSubject.asObservable();

  constructor() {
    this.initAudio();
  }

  // === VALIDATION METHODS ===
  private validateTrack(track: Track): Result<Track, ValidationError> {
    if (!isDefined(track)) {
      return Result.Error(createValidationError('Track is required', { track: ['Track cannot be null or undefined'] }));
    }

    if (!isDefined(track.id) || track.id.trim() === '') {
      return Result.Error(createValidationError('Track ID is required', { id: ['Track ID cannot be empty'] }));
    }

    if (!isDefined(track.audioFile) || track.audioFile.trim() === '') {
      return Result.Error(createValidationError('Audio file is required for playback', { audioFile: ['Track must have an audio file to play'] }));
    }

    return Result.Ok(track);
  }

  private validateVolume(volume: number): Result<number, ValidationError> {
    if (!isDefined(volume) || isNaN(volume)) {
      return Result.Error(createValidationError('Volume must be a valid number', { volume: ['Volume is required and must be numeric'] }));
    }

    if (volume < 0 || volume > 1) {
      return Result.Error(createValidationError('Volume must be between 0 and 1', { volume: ['Volume must be in range 0-1'] }));
    }

    return Result.Ok(volume);
  }

  private validateSeekTime(time: number, duration: number): Result<number, ValidationError> {
    if (!isDefined(time) || isNaN(time)) {
      return Result.Error(createValidationError('Seek time must be a valid number', { time: ['Time is required and must be numeric'] }));
    }

    if (time < 0) {
      return Result.Error(createValidationError('Seek time cannot be negative', { time: ['Time must be >= 0'] }));
    }

    if (isDefined(duration) && time > duration) {
      return Result.Error(createValidationError('Seek time cannot exceed track duration', { time: ['Time cannot exceed duration'] }));
    }

    return Result.Ok(time);
  }

  // === URL HANDLING ===
  private getFullAudioUrl(audioFilePath: string): Result<string, DomainError> {
    if (!isDefined(audioFilePath) || audioFilePath.trim() === '') {
      return Result.Error(createUnknownError('Audio file path is empty', {
        code: AudioErrorCode.INVALID_TRACK
      }));
    }

    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return Result.Ok(audioFilePath);
    }

    return Result.Ok(this.apiConfig.getUrl(`files/${audioFilePath}`));
  }

  // === AUDIO INITIALIZATION ===
  private initAudio(): void {
    if (isDefined(this.audioElement)) {
      const cleanupResult = this.cleanupAudioElement();
      Result.match(
        cleanupResult,
        () => { /* no-op */ },
        (error) => {
          this.errorHandler.handleError(error, {
            component: 'AudioPlaybackService',
            action: 'initAudio'
          });
        }
      );
    }

    this.audioElement = new Audio();

    this.audioElement.addEventListener('timeupdate', () => { this.handleTimeUpdate(); });
    this.audioElement.addEventListener('ended', () => { this.handleEnded(); });
    this.audioElement.addEventListener('loadedmetadata', () => { this.handleLoaded(); });
    this.audioElement.addEventListener('error', (event) => { this.handleError(event); });
    this.audioElement.addEventListener('canplay', () => { this.handleCanPlay(); });
    this.audioElement.addEventListener('loadeddata', () => { this.handleLoadedData(); });
    this.audioElement.addEventListener('canplaythrough', () => { this.handleCanPlayThrough(); });

    // Load saved volume (no try-catch needed for localStorage)
    const savedVolume = localStorage.getItem('audioVolume');
    if (isDefined(savedVolume)) {
      const volume = parseFloat(savedVolume);
      if (!isNaN(volume) && isDefined(this.audioElement)) {
        this.audioElement.volume = volume;
        this.updateState({ volume });
      }
    }
  }

  // === EVENT HANDLERS ===
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
    if (!isDefined(this.audioElement) ||
        this.audioElement.src === '' ||
        this.audioElement.src === window.location.href ||
        this.audioElement.readyState === 0) {
      return;
    }

    let audioError: DomainError;

    if (isDefined(this.audioElement.error)) {
      const mediaError = this.audioElement.error;
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          audioError = createUnknownError('Playback was aborted by the user', {
            code: AudioErrorCode.MEDIA_ERR_ABORTED,
            originalError: mediaError
          });
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          audioError = createUnknownError('Network error while loading audio', {
            code: AudioErrorCode.MEDIA_ERR_NETWORK,
            originalError: mediaError
          });
          break;
        case MediaError.MEDIA_ERR_DECODE:
          audioError = createUnknownError('Audio decoding error', {
            code: AudioErrorCode.MEDIA_ERR_DECODE,
            originalError: mediaError
          });
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          audioError = createUnknownError('Audio format not supported', {
            code: AudioErrorCode.MEDIA_ERR_SRC_NOT_SUPPORTED,
            originalError: mediaError
          });
          break;
        default:
          audioError = createUnknownError(`Audio error (code ${String(mediaError.code)})`, {
            originalError: mediaError
          });
      }
    } else {
      audioError = createUnknownError('Audio error without media error information', {
        originalError: event
      });
    }

    const handledError = this.errorHandler.handleError(audioError, {
      component: 'AudioPlaybackService',
      action: 'playback',
      url: this.audioElement.src
    });

    this.updateState({
      isPlaying: false,
      error: this.errorHandler.getUserFriendlyMessage(handledError)
    });
  }

  private handleCanPlay(): void {
    // Audio ready for playback
  }

  private handleLoadedData(): void {
    // Audio data loaded
  }

  private handleCanPlayThrough(): void {
    const state = this.audioStateSubject.value;
    if (isDefined(state.track) && this.isPlaybackInProgress) {
      void this.play();
    }
  }

  // === CLEANUP ===
  private cleanupAudioElement(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) return Result.Ok(undefined);

    // Direct execution instead of safeExecute
    if (isDefined(this.audioElement)) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.load();
    }

    return Result.Ok(undefined);
  }

  // === PUBLIC METHODS ===
  public playTrack(track: Track): Result<void, DomainError> {
    const trackValidation = this.validateTrack(track);

    return Result.match(
      trackValidation,
      (validatedTrack) => {
        this.isPlaybackInProgress = true;

        const stopResult = this.stop();
        Result.match(
          stopResult,
          () => { /* no-op */ },
          (error) => {
            this.errorHandler.handleError(error, {
              component: 'AudioPlaybackService',
              action: 'playTrack'
            });
          }
        );

        this.initAudio();

        this.updateState({
          track,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          error: null
        });

        const urlResult = this.getFullAudioUrl(validatedTrack.audioFile ?? '');

        return Result.match(
          urlResult,
          (audioFileUrl) => {
            if (isDefined(this.audioElement)) {
              this.updateState({ error: null });

              // Direct execution instead of safeExecute
              this.audioElement.src = audioFileUrl;
              this.audioElement.load();

              this.audioElement.oncanplaythrough = () => {
                void this.play();
                if (isDefined(this.audioElement)) {
                  this.audioElement.oncanplaythrough = null;
                }
              };
            }

            setTimeout(() => {
              if (this.isPlaybackInProgress) {
                this.isPlaybackInProgress = false;
              }
            }, 5000);

            return Result.Ok(undefined);
          },
          (error) => {
            const handledError = this.errorHandler.handleError(error, {
              component: 'AudioPlaybackService',
              action: 'playTrack'
            });

            this.updateState({
              error: this.errorHandler.getUserFriendlyMessage(handledError),
              isPlaying: false
            });
            this.isPlaybackInProgress = false;
            return Result.Error(handledError);
          }
        );
      },
      (error) => {
        const handledError = this.errorHandler.handleError(error, {
          component: 'AudioPlaybackService',
          action: 'playTrack'
        });

        this.updateState({
          error: this.errorHandler.getUserFriendlyMessage(handledError),
          isPlaying: false
        });
        return Result.Error(handledError);
      }
    );
  }

  public async play(): Promise<void> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      const handledError = this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'play'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError),
        isPlaying: false
      });
      return;
    }

    if (this.audioElement.src === '') {
      const error = createUnknownError('No audio source set', { code: AudioErrorCode.PLAYBACK_FAILED });
      const handledError = this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'play'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError),
        isPlaying: false
      });
      return;
    }

    this.updateState({ error: null });

    // Replace fromPromise with direct promise handling using Result monads
    const playResult = await this.audioElement.play().then(
      () => Result.Ok(undefined),
      (error: unknown) => Result.Error(createUnknownError(
        error instanceof Error ? error.message : 'Play failed',
        { code: AudioErrorCode.PLAYBACK_FAILED, originalError: error }
      ))
    );

    Result.match(
      playResult,
      () => {
        this.updateState({ isPlaying: true });
        this.isPlaybackInProgress = false;
      },
      (error) => {
        const handledError = this.errorHandler.handleError(error, {
          component: 'AudioPlaybackService',
          action: 'play'
        });

        this.updateState({
          isPlaying: false,
          error: this.errorHandler.getUserFriendlyMessage(handledError)
        });
        this.isPlaybackInProgress = false;
      }
    );
  }

  public pause(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return Result.Error(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'pause'
      }));
    }

    // Direct execution instead of safeExecute
    this.audioElement.pause();
    this.updateState({ isPlaying: false });
    return Result.Ok(undefined);
  }

  public stop(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) return Result.Ok(undefined);

    // Direct execution instead of safeExecute
    this.audioElement.pause();
    this.audioElement.src = '';
    this.audioElement.load();

    this.updateState({
      isPlaying: false,
      currentTime: 0,
      track: null,
      error: null
    });

    return Result.Ok(undefined);
  }

  public seek(time: number): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return Result.Error(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'seek'
      }));
    }

    const duration = this.audioStateSubject.value.duration;
    const timeValidation = this.validateSeekTime(time, duration);

    return Result.match(
      timeValidation,
      (validatedTime) => {
        // Direct execution instead of safeExecute
        if (isDefined(this.audioElement)) {
          this.audioElement.currentTime = validatedTime;
        }
        this.updateState({ currentTime: validatedTime });
        return Result.Ok(undefined);
      },
      (error) => {
        const handledError = this.errorHandler.handleError(error, {
          component: 'AudioPlaybackService',
          action: 'seek'
        });

        this.updateState({
          error: this.errorHandler.getUserFriendlyMessage(handledError)
        });
        return Result.Error(handledError);
      }
    );
  }

  public setVolume(volume: number): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return Result.Error(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'setVolume'
      }));
    }

    const volumeValidation = this.validateVolume(volume);

    return Result.match(
      volumeValidation,
      (validatedVolume) => {
        // Direct execution instead of safeExecute
        if (isDefined(this.audioElement)) {
          this.audioElement.volume = validatedVolume;
          localStorage.setItem('audioVolume', validatedVolume.toString());
        }

        this.updateState({ volume: validatedVolume });
        return Result.Ok(undefined);
      },
      (error) => {
        const handledError = this.errorHandler.handleError(error, {
          component: 'AudioPlaybackService',
          action: 'setVolume'
        });

        this.updateState({
          error: this.errorHandler.getUserFriendlyMessage(handledError)
        });
        return Result.Error(handledError);
      }
    );
  }

  public togglePlayPause(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return Result.Error(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'togglePlayPause'
      }));
    }

    if (!isDefined(this.audioStateSubject.value.track)) {
      const error = createUnknownError('No track selected', { code: AudioErrorCode.INVALID_TRACK });
      return Result.Error(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'togglePlayPause'
      }));
    }

    if (this.audioElement.readyState === 0) {
      const error = createUnknownError('Audio source is not loaded properly', { code: AudioErrorCode.PLAYBACK_FAILED });
      const handledError = this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'togglePlayPause'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError),
        isPlaying: false
      });
      return Result.Error(handledError);
    }

    if (this.audioStateSubject.value.isPlaying) {
      return this.pause();
    } else {
      void this.play();
      return Result.Ok(undefined);
    }
  }

  public getCurrentTrack(): Track | null {
    return this.audioStateSubject.value.track;
  }

  public isCurrentTrack(trackId: string): boolean {
    const currentTrack = this.audioStateSubject.value.track;
    return isDefined(currentTrack) && currentTrack.id === trackId;
  }

  public isPlaying(): boolean {
    return this.audioStateSubject.value.isPlaying;
  }

  public reset(): Result<void, DomainError> {
    this.isPlaybackInProgress = false;
    const cleanupResult = this.cleanupAudioElement();

    Result.match(
      cleanupResult,
      () => { /* no-op */ },
      (error) => {
        const handledError = this.errorHandler.handleError(error, {
          component: 'AudioPlaybackService',
          action: 'reset'
        });

        this.updateState({
          error: this.errorHandler.getUserFriendlyMessage(handledError)
        });
      }
    );

    this.initAudio();

    this.updateState({
      track: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    });

    return Result.Ok(undefined);
  }

  // === PRIVATE UTILITIES ===
  private updateState(partialState: Partial<AudioState>): void {
    this.audioStateSubject.next({
      ...this.audioStateSubject.value,
      ...partialState
    });
  }
}
