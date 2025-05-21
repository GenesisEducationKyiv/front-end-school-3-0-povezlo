import {inject, Injectable} from '@angular/core';
import {Track} from '../../../entities';
import {BehaviorSubject} from 'rxjs';
import {ApiConfigService} from '../../../shared';

export interface AudioState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: any,
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
    if (this.audioElement) {
      this.cleanupAudioElement();
    }

    this.audioElement = new Audio();

    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.handleLoaded = this.handleLoaded.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleCanPlay = this.handleCanPlay.bind(this);
    this.handleLoadedData = this.handleLoadedData.bind(this);
    this.handleCanPlayThrough = this.handleCanPlayThrough.bind(this);

    this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audioElement.addEventListener('ended', this.handleEnded);
    this.audioElement.addEventListener('loadedmetadata', this.handleLoaded);
    this.audioElement.addEventListener('error', this.handleError);
    this.audioElement.addEventListener('canplay', this.handleCanPlay);
    this.audioElement.addEventListener('loadeddata', this.handleLoadedData);
    this.audioElement.addEventListener('canplaythrough', this.handleCanPlayThrough);

    const savedVolume = localStorage.getItem('audioVolume');
    if (savedVolume) {
      const volume = parseFloat(savedVolume);
      this.audioElement.volume = volume;
      this.updateState({ volume });
    }
  }

  private handleTimeUpdate(): void {
    if (!this.audioElement) return;
    this.updateState({ currentTime: this.audioElement.currentTime });
  }

  private handleEnded(): void {
    this.updateState({ isPlaying: false, currentTime: 0 });
  }

  private handleLoaded(): void {
    if (!this.audioElement) return;
    this.updateState({ duration: this.audioElement.duration });
  }

  private handleError(event: any): void {
    let errorMessage = 'Неизвестная ошибка аудио';

    if (this.audioElement && this.audioElement.error) {
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
          errorMessage = `Ошибка аудио (код ${mediaError.code})`;
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
    if (state.track && this.isPlaybackInProgress) {
      this.play();
    }
  }

  private cleanupAudioElement(): void {
    if (!this.audioElement) return;

    try {
      this.audioElement.pause();
      this.audioElement.src = '';

      this.audioElement.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.audioElement.removeEventListener('ended', this.handleEnded);
      this.audioElement.removeEventListener('loadedmetadata', this.handleLoaded);
      this.audioElement.removeEventListener('error', this.handleError);
      this.audioElement.removeEventListener('canplay', this.handleCanPlay);
      this.audioElement.removeEventListener('loadeddata', this.handleLoadedData);
      this.audioElement.removeEventListener('canplaythrough', this.handleCanPlayThrough);

      this.audioElement.load();
    } catch (error) {
      console.error('Error cleaning up audio element:', error);
    }
  }

  public playTrack(track: Track): void {
    if (!track.audioFile) {
      this.updateState({
        error: 'Track has no audio file',
        isPlaying: false
      });
      console.error('Track has no audio file');
      return;
    }

    const forcePlay = true;

    const currentState = this.audioStateSubject.value;
    const isSameTrack = currentState.track?.id === track.id;

    if (isSameTrack && !forcePlay) {
      this.togglePlayPause();
      return;
    }


    if (this.isPlaybackInProgress) {
      console.log('Playback already in progress, ignoring call');
      return;
    }

    this.isPlaybackInProgress = true;

    this.stop();

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

    if (this.audioElement) {
      this.updateState({ error: null });

      try {
        this.audioElement.src = audioFileUrl;
        this.audioElement.load();

        this.audioElement.oncanplaythrough = () => {
          console.log('Audio can play through event fired, starting playback');
          this.play();
          this.audioElement!.oncanplaythrough = null;
        };
      } catch (error) {
        console.error('Error setting audio source:', error);
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
    if (!this.audioElement || !this.audioStateSubject.value.track) {
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
      this.play();
    }
  }

  public play(): void {
    if (!this.audioElement) return;

    if (!this.audioElement.src) {
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

    const playPromise = this.audioElement.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Audio playback started successfully');
        this.updateState({ isPlaying: true });
        this.isPlaybackInProgress = false;
      }).catch(error => {
        console.error('Error playing audio:', error);
        this.updateState({
          isPlaying: false,
          error: `Failed to play audio: ${error.message || 'Unknown error'}`
        });
        this.isPlaybackInProgress = false;
      });
    } else {
      this.isPlaybackInProgress = false;
    }
  }

  public pause(): void {
    if (!this.audioElement) return;

    this.audioElement.pause();
    this.updateState({ isPlaying: false });
  }

  public stop(): void {
    if (!this.audioElement) return;

    try {
      this.audioElement.pause();
      this.audioElement.src = '';

      try {
        this.audioElement.load();
      } catch (loadError) {
        console.warn('Non-critical error when loading empty audio source:', loadError);
      }

      this.updateState({
        isPlaying: false,
        currentTime: 0,
        track: null,
        error: null
      });
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  public seek(time: number): void {
    if (!this.audioElement) return;

    try {
      this.audioElement.currentTime = time;
      this.updateState({ currentTime: time });
    } catch (error) {
      console.error('Error seeking audio:', error);
      this.updateState({
        error: 'Ошибка при перемотке аудио',
      });
    }
  }

  public setVolume(volume: number): void {
    if (!this.audioElement) return;

    volume = Math.max(0, Math.min(1, volume));

    try {
      this.audioElement.volume = volume;
      this.updateState({ volume });
      localStorage.setItem('audioVolume', volume.toString());
    } catch (error) {
      console.error('Error setting volume:', error);
    }
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
    this.cleanupAudioElement();

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
