import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatChip, MatChipInputEvent, MatChipRemove, MatChipSet } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect} from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { isArray, TestIdDirective, ToastService, zodValidator, OptimizedImageComponent } from '@app/shared';
import { GenreQueryService, Track, TrackQueryService, TrackUpdate, TrackUpdateSchema } from '@app/entities';

interface TrackEditModalData {
  track: Track;
}

@Component({
  selector: 'app-track-edit-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    TestIdDirective,
    MatProgressSpinner,
    NgIf,
    ReactiveFormsModule,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    NgForOf,
    MatChipSet,
    MatChip,
    MatChipRemove,
    MatIcon,
    MatError,
    MatDialogActions,
    MatButton,
    MatLabel,
    OptimizedImageComponent,
  ],
  templateUrl: './track-edit-modal.component.html',
  styleUrl: './track-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackEditModalComponent implements OnInit {
  public form!: FormGroup;
  public genres: string[] = [];
  public loading = false;
  public submitting = false;
  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  private fb = inject(FormBuilder);
  private trackQueryService = inject(TrackQueryService);
  private genreQueryService = inject(GenreQueryService);
  private dialogRef = inject(MatDialogRef<TrackEditModalComponent>);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  public data = inject<TrackEditModalData>(MAT_DIALOG_DATA);

  public ngOnInit(): void {
    this.initForm();
    this.loadGenres();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: [this.data.track.title, [zodValidator(TrackUpdateSchema.shape.title)]],
      artist: [this.data.track.artist, [zodValidator(TrackUpdateSchema.shape.artist)]],
      album: [this.data.track.album ?? ''],
      genres: [this.data.track.genres, [zodValidator(TrackUpdateSchema.shape.genres)]],
      coverImage: [this.data.track.coverImage ?? '', [zodValidator(TrackUpdateSchema.shape.coverImage)]]
    });
  }

  private loadGenres(): void {
    // Use computed signal directly - no need for loading state
    this.genres = this.genreQueryService.genreNames();
  }

  public addGenre(event: MatChipInputEvent): void {
    const value = event.value.trim();
    const formValue: unknown = this.form.get('genres')?.value;

    if (isArray<string>(formValue)) {
      const currentGenres = formValue;
      if (value !== '' && !currentGenres.includes(value) && this.genres.includes(value)) {
        this.form.get('genres')?.setValue([...currentGenres, value]);
      }
    }

    event.chipInput.clear();
  }

  public removeGenre(genre: string): void {
    const formValue: unknown = this.form.get('genres')?.value;

    if (isArray<string>(formValue)) {
      const updatedGenres = formValue.filter(g => g !== genre);
      this.form.get('genres')?.setValue(updatedGenres);
    }
  }

  public selectGenre(genre: string): void {
    const formValue: unknown = this.form.get('genres')?.value;

    if (isArray<string>(formValue)) {
      const currentGenres = formValue;
      if (!currentGenres.includes(genre)) {
        this.form.get('genres')?.setValue([...currentGenres, genre]);
      }
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formData = this.form.value as TrackUpdate;

    this.trackQueryService.updateTrackMutation.mutate(
      { id: this.data.track.id, data: formData },
      {
        onSuccess: (track) => {
          this.submitting = false;
          this.toast.success(`Track "${track.title}" updated successfully`);
          this.dialogRef.close(track);
          this.cdr.markForCheck();
        },
        onError: (error) => {
          this.submitting = false;
          console.error('Failed to update track', error);
          this.toast.error('Failed to update track. Please try again.');
          this.cdr.markForCheck();
        }
      }
    );
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public get titleControl(): AbstractControl | null { return this.form.get('title'); }
  public get artistControl(): AbstractControl | null { return this.form.get('artist'); }
  public get albumControl(): AbstractControl | null { return this.form.get('album'); }
  public get genresControl(): AbstractControl | null { return this.form.get('genres'); }
  public get coverImageControl(): AbstractControl | null { return this.form.get('coverImage'); }
}
