import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { NgForOf, NgIf } from '@angular/common';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatChip, MatChipRemove, MatChipSet } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import {
  isArray,
  TestIdDirective,
  ToastService,
  zodValidator,
  Result
} from '@app/shared';
import { GenreService, TrackCreate, TrackCreateSchema, TrackService } from '@app/entities';

@Component({
  selector: 'app-track-create-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    NgIf,
    MatProgressSpinner,
    TestIdDirective,
    ReactiveFormsModule,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatChipSet,
    MatChip,
    MatChipRemove,
    NgForOf,
    MatIcon,
    MatError,
    MatDialogActions,
    MatButton,
    MatLabel,
  ],
  templateUrl: './track-create-modal.component.html',
  styleUrls: ['./track-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackCreateModalComponent implements OnInit {
  public form!: FormGroup;
  public genres: string[] = [];
  public loading = false;
  public submitting = false;
  public readonly separatorKeysCodes = [ENTER, COMMA] as const;

  private fb = inject(FormBuilder);
  private trackService = inject(TrackService);
  private genreService = inject(GenreService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  constructor(private dialogRef: MatDialogRef<TrackCreateModalComponent>) {}

  public ngOnInit(): void {
    this.initForm();
    this.loadGenres();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [zodValidator(TrackCreateSchema.shape.title)]],
      artist: ['', [zodValidator(TrackCreateSchema.shape.artist)]],
      album: [''],
      genres: [[], [zodValidator(TrackCreateSchema.shape.genres)]],
      coverImage: ['', [zodValidator(TrackCreateSchema.shape.coverImage)]]
    });
  }

  private loadGenres(): void {
    this.loading = true;
    this.genreService.getGenres()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        Result.match(
          result,
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

  public removeGenre(genre: string): void {
    console.log('removeGenre', genre);
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

    const formData = this.form.value as TrackCreate;

    this.trackService.createTrack(formData)
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        Result.match(
          result,
          (track) => {
            this.dialogRef.close(track);
            this.toast.success('The track has been successfully created');
          },
          (error) => {
            console.error('Failed to create track', error);
            this.toast.error('Failed to create track');
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
