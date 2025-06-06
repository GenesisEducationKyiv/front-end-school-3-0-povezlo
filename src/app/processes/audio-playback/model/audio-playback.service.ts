import { inject, Injectable } from '@angular/core';
import { Track } from '@app/entities';
import { BehaviorSubject } from 'rxjs';
import { Result, ok, err, fromPromise } from 'neverthrow';
import {
  ApiConfigService,
  safeExecute,
  UnknownError,
  isDefined,
  ErrorHandlingService,
  createValidationError,
  createUnknownError,
  DomainError,
  ValidationError
} from '@app/shared';

export enum AudioErrorCode {
  MEDIA_ERR_ABORTED = 'MEDIA_ERR_ABORTED',
  MEDIA_ERR_NETWORK = 'MEDIA_ERR_NETWORK',
  MEDIA_ERR_DECODE = 'MEDIA_ERR_DECODE',
  MEDIA_ERR_SRC_NOT_SUPPORTED = 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  AUDIO_NOT_AVAILABLE = 'AUDIO_NOT_AVAILABLE',
  INVALID_TRACK = 'INVALID_TRACK',
  INVALID_VOLUME = 'INVALID_VOLUME',
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

  private validateTrack(track: Track): Result<Track, ValidationError> {
    if (!isDefined(track)) {
      return err(createValidationError('Track is required', { track: ['Track cannot be null or undefined'] }));
    }

    if (!isDefined(track.id) || track.id.trim() === '') {
      return err(createValidationError('Track ID is required', { id: ['Track ID cannot be empty'] }));
    }

    if (!isDefined(track.audioFile) || track.audioFile.trim() === '') {
      return err(createValidationError('Audio file is required for playback', { audioFile: ['Track must have an audio file to play'] }));
    }

    return ok(track);
  }

  private validateVolume(volume: number): Result<number, ValidationError> {
    if (!isDefined(volume) || isNaN(volume)) {
      return err(createValidationError('Volume must be a valid number', { volume: ['Volume is required and must be numeric'] }));
    }

    if (volume < 0 || volume > 1) {
      return err(createValidationError('Volume must be between 0 and 1', { volume: ['Volume must be in range 0-1'] }));
    }

    return ok(volume);
  }

  private validateSeekTime(time: number, duration: number): Result<number, ValidationError> {
    if (!isDefined(time) || isNaN(time)) {
      return err(createValidationError('Seek time must be a valid number', { time: ['Time is required and must be numeric'] }));
    }

    if (time < 0) {
      return err(createValidationError('Seek time cannot be negative', { time: ['Time must be >= 0'] }));
    }

    if (isDefined(duration) && time > duration) {
      return err(createValidationError('Seek time cannot exceed track duration', { time: ['Time cannot exceed duration'] }));
    }

    return ok(time);
  }

  private initAudio(): void {
    if (isDefined(this.audioElement)) {
      const cleanupResult = this.cleanupAudioElement();
      if (cleanupResult.isErr()) {
        this.errorHandler.handleError(cleanupResult.error, {
          component: 'AudioPlaybackService',
          action: 'initAudio'
        });
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
    // Ignore errors from empty audio elements (e.g., during reset/initialization)
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

  private cleanupAudioElement(): Result<void, UnknownError> {
    if (!isDefined(this.audioElement)) return ok(undefined);

    const pauseResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
    })();

    if (pauseResult.isErr()) {
      this.errorHandler.handleError(pauseResult.error, {
        component: 'AudioPlaybackService',
        action: 'cleanupAudioElement'
      });
      return pauseResult;
    }

    const loadResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.load();
      }
    })();

    if (loadResult.isErr()) {
      this.errorHandler.handleError(loadResult.error, {
        component: 'AudioPlaybackService',
        action: 'cleanupAudioElement'
      });
    }

    return ok(undefined);
  }

  public playTrack(track: Track): Result<void, DomainError> {
    const trackValidation = this.validateTrack(track);
    if (trackValidation.isErr()) {
      const error = this.errorHandler.handleError(trackValidation.error, {
        component: 'AudioPlaybackService',
        action: 'playTrack'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(error),
        isPlaying: false
      });
      return err(error);
    }

    // Reset any previous playback state and start fresh
    this.isPlaybackInProgress = true;

    const stopResult = this.stop();
    if (stopResult.isErr()) {
      this.errorHandler.handleError(stopResult.error, {
        component: 'AudioPlaybackService',
        action: 'playTrack'
      });
    }

    this.initAudio();

    this.updateState({
      track,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    });

    const validatedTrack = trackValidation.value;

    let audioFileUrl: string;
    try {
      audioFileUrl = this.getFullAudioUrl(validatedTrack.audioFile ?? '');
    } catch (urlError) {
      const error = createUnknownError('Invalid audio file path', {
        code: AudioErrorCode.INVALID_TRACK,
        originalError: urlError
      });
      const handledError = this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'playTrack'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError),
        isPlaying: false
      });
      this.isPlaybackInProgress = false;
      return err(handledError);
    }

    if (isDefined(this.audioElement)) {
      this.updateState({ error: null });

      const setupResult = safeExecute(() => {
        if (isDefined(this.audioElement)) {
          this.audioElement.src = audioFileUrl;
          this.audioElement.load();

          this.audioElement.oncanplaythrough = () => {
            void this.play();
            if (isDefined(this.audioElement)) {
              this.audioElement.oncanplaythrough = null;
            }
          };
        }
      })();

      if (setupResult.isErr()) {
        const error = this.errorHandler.handleError(setupResult.error, {
          component: 'AudioPlaybackService',
          action: 'playTrack'
        });

        this.updateState({
          error: this.errorHandler.getUserFriendlyMessage(error),
          isPlaying: false
        });
        this.isPlaybackInProgress = false;
        return err(error);
      }
    }

    setTimeout(() => {
      if (this.isPlaybackInProgress) {
        this.isPlaybackInProgress = false;
      }
    }, 5000);

    return ok(undefined);
  }

  public togglePlayPause(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return err(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'togglePlayPause'
      }));
    }

    if (!isDefined(this.audioStateSubject.value.track)) {
      const error = createUnknownError('No track selected', { code: AudioErrorCode.INVALID_TRACK });
      return err(this.errorHandler.handleError(error, {
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
      return err(handledError);
    }

    if (this.audioStateSubject.value.isPlaying) {
      return this.pause();
    } else {
      void this.play();
      return ok(undefined);
    }
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

    const playResult = await fromPromise(
      this.audioElement.play(),
      (error: unknown) => createUnknownError(
        error instanceof Error ? error.message : 'Unknown error',
        { code: AudioErrorCode.PLAYBACK_FAILED, originalError: error }
      )
    );

    if (playResult.isOk()) {
      this.updateState({ isPlaying: true });
      this.isPlaybackInProgress = false;
    } else {
      const handledError = this.errorHandler.handleError(playResult.error, {
        component: 'AudioPlaybackService',
        action: 'play'
      });

      this.updateState({
        isPlaying: false,
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      this.isPlaybackInProgress = false;
    }
  }

  public pause(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return err(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'pause'
      }));
    }

    const pauseResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.pause();
      }
    })();

    if (pauseResult.isErr()) {
      const handledError = this.errorHandler.handleError(pauseResult.error, {
        component: 'AudioPlaybackService',
        action: 'pause'
      });
      return err(handledError);
    }

    this.updateState({ isPlaying: false });
    return ok(undefined);
  }

  public stop(): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) return ok(undefined);

    const stopResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
    })();

    if (stopResult.isErr()) {
      const handledError = this.errorHandler.handleError(stopResult.error, {
        component: 'AudioPlaybackService',
        action: 'stop'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      return err(handledError);
    }

    const loadResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.load();
      }
    })();

    if (loadResult.isErr()) {
      this.errorHandler.handleError(loadResult.error, {
        component: 'AudioPlaybackService',
        action: 'stop'
      });
    }

    this.updateState({
      isPlaying: false,
      currentTime: 0,
      track: null,
      error: null
    });

    return ok(undefined);
  }

  public seek(time: number): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return err(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'seek'
      }));
    }

    const duration = this.audioStateSubject.value.duration;
    const timeValidation = this.validateSeekTime(time, duration);
    if (timeValidation.isErr()) {
      const handledError = this.errorHandler.handleError(timeValidation.error, {
        component: 'AudioPlaybackService',
        action: 'seek'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      return err(handledError);
    }

    const seekResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.currentTime = timeValidation.value;
      }
    })();

    if (seekResult.isErr()) {
      const handledError = this.errorHandler.handleError(seekResult.error, {
        component: 'AudioPlaybackService',
        action: 'seek'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      return err(handledError);
    }

    this.updateState({ currentTime: timeValidation.value });
    return ok(undefined);
  }

  public setVolume(volume: number): Result<void, DomainError> {
    if (!isDefined(this.audioElement)) {
      const error = createUnknownError('Audio element not available', { code: AudioErrorCode.AUDIO_NOT_AVAILABLE });
      return err(this.errorHandler.handleError(error, {
        component: 'AudioPlaybackService',
        action: 'setVolume'
      }));
    }

    const volumeValidation = this.validateVolume(volume);
    if (volumeValidation.isErr()) {
      const handledError = this.errorHandler.handleError(volumeValidation.error, {
        component: 'AudioPlaybackService',
        action: 'setVolume'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      return err(handledError);
    }

    const validatedVolume = volumeValidation.value;

    const volumeResult = safeExecute(() => {
      if (isDefined(this.audioElement)) {
        this.audioElement.volume = validatedVolume;
        localStorage.setItem('audioVolume', validatedVolume.toString());
      }
    })();

    if (volumeResult.isErr()) {
      const handledError = this.errorHandler.handleError(volumeResult.error, {
        component: 'AudioPlaybackService',
        action: 'setVolume'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      return err(handledError);
    }

    this.updateState({ volume: validatedVolume });
    return ok(undefined);
  }

  public getCurrentTrack(): Track | null {
    return this.audioStateSubject.value.track;
  }

  public isCurrentTrack(trackId: string): boolean {
    const currentTrack = this.audioStateSubject.value.track;
    return currentTrack !== null && currentTrack.id === trackId;
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
    if (!isDefined(audioFilePath) || audioFilePath === '' || audioFilePath.trim() === '') {
      throw new Error('Audio file path is empty');
    }

    if (audioFilePath.startsWith('http://') || audioFilePath.startsWith('https://')) {
      return audioFilePath;
    }
    return this.apiConfig.getUrl(`files/${audioFilePath}`);
  }

  public reset(): Result<void, DomainError> {
    this.isPlaybackInProgress = false;
    const cleanupResult = this.cleanupAudioElement();
    if (cleanupResult.isErr()) {
      const handledError = this.errorHandler.handleError(cleanupResult.error, {
        component: 'AudioPlaybackService',
        action: 'reset'
      });

      this.updateState({
        error: this.errorHandler.getUserFriendlyMessage(handledError)
      });
      return err(handledError);
    }

    this.initAudio();

    this.updateState({
      track: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    });

    return ok(undefined);
  }
}
