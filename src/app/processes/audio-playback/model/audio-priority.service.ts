import { Injectable, signal } from '@angular/core';
import { Track } from '@app/entities';

export enum AudioPriority {
  ACTIVE_TRACK = 'ACTIVE_TRACK',
  MANUAL_TRACK = 'MANUAL_TRACK'
}

export interface AudioPriorityState {
  currentPriority: AudioPriority;
  activeTrack: Track | null;
  manualTrack: Track | null;
  isManualPlayerOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AudioPriorityService {
  private priorityState = signal<AudioPriorityState>({
    currentPriority: AudioPriority.ACTIVE_TRACK,
    activeTrack: null,
    manualTrack: null,
    isManualPlayerOpen: false
  });

  public readonly state = this.priorityState.asReadonly();

  public setActiveTrack(track: Track | null): void {
    this.priorityState.update(state => ({
      ...state,
      activeTrack: track
    }));
  }

  public setManualTrack(track: Track | null): void {
    this.priorityState.update(state => ({
      ...state,
      manualTrack: track,
      currentPriority: track !== null ? AudioPriority.MANUAL_TRACK : AudioPriority.ACTIVE_TRACK,
      isManualPlayerOpen: track !== null
    }));
  }

  public closeManualPlayer(): void {
    this.priorityState.update(state => ({
      ...state,
      manualTrack: null,
      currentPriority: AudioPriority.ACTIVE_TRACK,
      isManualPlayerOpen: false
    }));
  }

  public getCurrentPriorityTrack(): Track | null {
    const state = this.priorityState();
    return state.currentPriority === AudioPriority.MANUAL_TRACK
      ? state.manualTrack
      : state.activeTrack;
  }

  public shouldPlayActiveTrack(): boolean {
    const state = this.priorityState();
    return state.currentPriority === AudioPriority.ACTIVE_TRACK && state.activeTrack !== null;
  }

  public shouldPlayManualTrack(): boolean {
    const state = this.priorityState();
    return state.currentPriority === AudioPriority.MANUAL_TRACK && state.manualTrack !== null;
  }
}
