import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl } from '@angular/forms';
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
import { MatOption, MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { z } from 'zod';
import { finalize } from 'rxjs/operators';
import { TestIdDirective, ToastService, zodValidator, observableToResult, isArray } from '@app/shared';
import { GenreService, Track, TrackService } from '@app/entities';

interface TrackEditModalData {
  track: Track;
}

// Zod схема для формы редактирования трека
const trackEditFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().min(1, 'Artist is required'),
  album: z.string().optional(),
  genres: z.array(z.string()).min(1, 'At least one genre is required'),
  coverImage: z.string().url('Invalid URL format').optional().or(z.literal(''))
});

type TrackFormData = z.infer<typeof trackEditFormSchema>;

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
  private trackService = inject(TrackService);
  private genreService = inject(GenreService);
  private dialogRef = inject(MatDialogRef<TrackEditModalComponent>);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  public data = inject<TrackEditModalData>(MAT_DIALOG_DATA);

  public ngOnInit(): void {
    this.initForm();
    this.loadGenres();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: [this.data.track.title, [zodValidator(trackEditFormSchema.shape.title)]],
      artist: [this.data.track.artist, [zodValidator(trackEditFormSchema.shape.artist)]],
      album: [this.data.track.album ?? ''],
      genres: [this.data.track.genres, [zodValidator(trackEditFormSchema.shape.genres)]],
      coverImage: [this.data.track.coverImage ?? '', [zodValidator(trackEditFormSchema.shape.coverImage)]]
    });
  }

  private loadGenres(): void {
    this.loading = true;
    observableToResult(this.genreService.getGenres())
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        result.match(
          (genres) => {
            this.genres = genres;
          },
          (error) => {
            console.error('Failed to load genres', error);
            this.toast.error('Failed to load genres');
          }
        );
      });
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
      const currentGenres = formValue;
      const updatedGenres = currentGenres.filter(g => g !== genre);
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

    const formData = this.form.value as TrackFormData;

    observableToResult(this.trackService.updateTrack(this.data.track.id, formData))
      .pipe(finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        result.match(
          (track) => {
            this.toast.success(`Track "${track.title}" updated successfully`);
            this.dialogRef.close(track);
          },
          (error) => {
            console.error('Failed to update track', error);
            this.toast.error('Failed to update track. Please try again.');
          }
        );
      });
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
