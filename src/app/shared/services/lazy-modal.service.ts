import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class LazyModalService {
  private dialog = inject(MatDialog);

  async openTrackCreateModal(config?: MatDialogConfig): Promise<MatDialogRef<unknown>> {
    const { TrackCreateModalComponent } = await import(
      '@app/features/track-create/modal/track-create-modal/track-create-modal.component'
    );
    return this.dialog.open(TrackCreateModalComponent, config);
  }

  async openTrackEditModal(config?: MatDialogConfig): Promise<MatDialogRef<unknown>> {
    const { TrackEditModalComponent } = await import(
      '@app/features/track-edit/modal/track-edit-modal/track-edit-modal.component'
    );
    return this.dialog.open(TrackEditModalComponent, config);
  }

  async openTrackDeleteModal(config?: MatDialogConfig): Promise<MatDialogRef<unknown>> {
    const { TrackDeleteModalComponent } = await import(
      '@app/features/track-delete/modal/track-delete-modal/track-delete-modal.component'
    );
    return this.dialog.open(TrackDeleteModalComponent, config);
  }

  async openTrackUploadModal(config?: MatDialogConfig): Promise<MatDialogRef<unknown>> {
    const { TrackUploadModalComponent } = await import(
      '@app/features/track-upload/modal/track-upload-modal/track-upload-modal.component'
    );
    return this.dialog.open(TrackUploadModalComponent, config);
  }
}
