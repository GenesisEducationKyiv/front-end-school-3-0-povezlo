import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { finalize } from 'rxjs/operators';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {TestIdDirective, ToastService, isDefined, Result} from '@app/shared';
import { Track, TrackService } from '@app/entities';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AudioPlaybackService } from '@app/processes';

interface DeleteDialogData {
  track?: Track;
  bulk?: boolean;
  count?: number;
  trackIds?: string[];
}

@Component({
  selector: 'app-track-delete-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    TestIdDirective,
    MatDialogActions,
    MatButton,
    MatProgressSpinner,
    NgIf
  ],
  templateUrl: './track-delete-modal.component.html',
  styleUrl: './track-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackDeleteModalComponent {
  public deleting = false;

  private trackService = inject(TrackService);
  private audioService = inject(AudioPlaybackService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<TrackDeleteModalComponent>);
  public data = inject<DeleteDialogData>(MAT_DIALOG_DATA);

  public onConfirm(): void {
    this.deleting = true;

    this.checkAndStopPlaybackIfNeeded();

    if (this.data.bulk === true) {
      this.dialogRef.close(true);
      return;
    }

    if (this.data.track === undefined) {
      this.dialogRef.close(false);
      return;
    }

    this.trackService.deleteTrack(this.data.track.id)
      .pipe(finalize(() => {
        this.deleting = false;
      }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        Result.match(
          result,
          () => {
            const trackTitle = this.data.track?.title ?? '';
            this.toast.success(`Track "${trackTitle}" deleted successfully`);
            this.dialogRef.close(true);
          },
          (error: unknown) => {
            console.error('Failed to delete track', error);
            this.toast.error('Failed to delete track. Please try again.');
            this.dialogRef.close(false);
          }
        );
      });
  }

  public onCancel(): void {
    this.dialogRef.close(false);
  }

  private checkAndStopPlaybackIfNeeded(): void {
    const currentTrack = this.audioService.getCurrentTrack();

    if (currentTrack === null) {
      return;
    }

    if (isDefined(this.data.track) && currentTrack.id === this.data.track.id) {
      console.log('Deleting currently playing track, stopping playback');
      this.audioService.reset();
    }

    if (this.data.bulk === true && this.data.trackIds?.includes(currentTrack.id) === true) {
      console.log('Deleting currently playing track in bulk operation, stopping playback');
      this.audioService.reset();
    }
  }

  public get title(): string {
    if (this.data.bulk === true) {
      return 'Delete Tracks';
    }
    return 'Delete Track';
  }

  public get message(): string {
    if (this.data.bulk === true) {
      const count = this.data.count ?? 0;
      return `Are you sure you want to delete ${String(count)} selected tracks? This action cannot be undone.`;
    }
    const trackTitle = this.data.track?.title ?? '';
    return `Are you sure you want to delete "${trackTitle}"? This action cannot be undone.`;
  }
}
