import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  computed,
  signal,
  effect
} from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelectChange } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  GenreQueryService,
  Track,
  TrackCardComponent,
  TrackPlayerComponent,
  TrackQueryService,
  TrackFilters
} from '@app/entities';
import { TestIdDirective, isDefined, UI_TIMING, MODAL_DIMENSIONS, LazyModalService } from '@app/shared';
import { AudioPlaybackService } from '@app/processes';

@Component({
  selector: 'app-track-list-widget-signals',
  standalone: true,
  imports: [
    TrackCardComponent,
    TrackPlayerComponent,
    TestIdDirective,
    NgIf,
    NgForOf,
    MatIcon,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatLabel,
    MatIconButton,
    MatButton,
    MatProgressSpinner,
    MatPaginator,
  ],
  templateUrl: './track-list-widget.component.html',
  styleUrl: './track-list-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackListWidgetSignalsComponent implements OnInit {
  private trackQueryService = inject(TrackQueryService);
  private genreQueryService = inject(GenreQueryService);
  private audioService = inject(AudioPlaybackService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private lazyModalService = inject(LazyModalService);

  // Local signals for UI state
  private searchTextSignal = signal<string>('');
  private selectedGenreSignal = signal<string>('');
  private selectedArtistSignal = signal<string>('');
  private selectModeSignal = signal<boolean>(false);
  private submittingSignal = signal<boolean>(false);

  // Public readonly signals
  public readonly searchText = this.searchTextSignal.asReadonly();
  public readonly selectedGenre = this.selectedGenreSignal.asReadonly();
  public readonly selectedArtist = this.selectedArtistSignal.asReadonly();
  public readonly selectMode = this.selectModeSignal.asReadonly();
  public readonly submitting = this.submittingSignal.asReadonly();

  // Data from Query services
  public readonly tracks = this.trackQueryService.tracks;
  public readonly pagination = this.trackQueryService.pagination;
  public readonly loading = this.trackQueryService.isLoading;
  public readonly genres = this.genreQueryService.genreNames;
  public readonly selectedTracks = this.trackQueryService.selectedTracks;
  public readonly hasSelectedTracks = this.trackQueryService.hasSelectedTracks;

  // Computed values
  public readonly artists = computed(() => {
    const uniqueArtists = new Set(
      this.tracks()
        .map(track => track.artist)
        .filter(artist => isDefined(artist) && artist.trim().length > 0)
    );
    return Array.from(uniqueArtists).sort();
  });

  public readonly currentPlayingTrack = computed(() => {
    // If we have Signal-based AudioService, use it
    // For now using existing service
    return null; // TODO: Update when we create AudioPlaybackSignalService
  });

  // Subject for search with debounce
  private searchSubject = new Subject<string>();

  public ngOnInit(): void {
    this.setupSearchDebounce();
    this.setupEffects();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(UI_TIMING.SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(searchText => {
        this.updateFilters({ search: searchText, page: 0 });
      });
  }

  private setupEffects(): void {
    // Effect for automatically updating filters when local state changes
    effect(() => {
      const genre = this.selectedGenre();
      const artist = this.selectedArtist();

      if (genre.length > 0 || artist.length > 0) {
        const filters: Partial<TrackFilters> = { page: 0 };
        if (genre.length > 0) filters.genre = genre;
        if (artist.length > 0) filters.artist = artist;
        this.updateFilters(filters);
      }
    });
  }

  // === FILTER METHODS ===
  public onSearchChange(searchText: string): void {
    this.searchTextSignal.set(searchText);
    this.searchSubject.next(searchText);
  }

  public onGenreChange(event: MatSelectChange): void {
    const value = event.value as string | undefined;
    this.selectedGenreSignal.set(value ?? '');
  }

  public onArtistChange(event: MatSelectChange): void {
    const value = event.value as string | undefined;
    this.selectedArtistSignal.set(value ?? '');
  }

  public onSortChange(event: MatSelectChange): void {
    const value = event.value as string;
    const [field, order] = value.split(':');
    const filters: Partial<TrackFilters> = { page: 0 };
    if (field != null) filters.sort = field;
    if (order != null) filters.order = order as 'asc' | 'desc';
    this.updateFilters(filters);
  }

  public onPageChange(event: PageEvent): void {
    this.updateFilters({
      page: event.pageIndex,
      limit: event.pageSize
    });
  }

  public clearFilters(): void {
    this.searchTextSignal.set('');
    this.selectedGenreSignal.set('');
    this.selectedArtistSignal.set('');
    this.trackQueryService.resetFilters();
  }

  private updateFilters(newFilters: Partial<TrackFilters>): void {
    this.trackQueryService.updateFilters(newFilters);
  }

  // === TRACK OPERATIONS ===
  public onTrackPlay(track: Track): void {
    this.audioService.playTrack(track);
    // Handle result if needed
  }

  public async onTrackEdit(track: Track): Promise<void> {
    const dialogRef = await this.lazyModalService.openTrackEditModal({
      width: MODAL_DIMENSIONS.TRACK_EDIT_WIDTH,
      data: { track }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.trackQueryService.refreshTracks();
      }
    });
  }

  public async onTrackDelete(track: Track): Promise<void> {
    const dialogRef = await this.lazyModalService.openTrackDeleteModal({
      width: MODAL_DIMENSIONS.TRACK_DELETE_WIDTH,
      data: { track }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.trackQueryService.refreshTracks();
      }
    });
  }

  public async onTrackUpload(track: Track): Promise<void> {
    const dialogRef = await this.lazyModalService.openTrackUploadModal({
      width: MODAL_DIMENSIONS.TRACK_UPLOAD_WIDTH,
      data: { track }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.trackQueryService.refreshTracks();
      }
    });
  }

  public onTrackSelect(event: { track: Track; selected: boolean }): void {
    this.trackQueryService.toggleTrackSelection(event.track.id);
  }

  // === BULK OPERATIONS ===
  public toggleSelectMode(): void {
    this.selectModeSignal.update(current => !current);
    if (!this.selectMode()) {
      this.trackQueryService.clearSelection();
    }
  }

  public selectAllTracks(): void {
    this.trackQueryService.selectAllTracks();
  }

  public clearSelection(): void {
    this.trackQueryService.clearSelection();
  }

  public async bulkDeleteSelected(): Promise<void> {
    const selectedIds = this.trackQueryService.selectedTrackIds();

    if (selectedIds.length === 0) return;

    const dialogRef = await this.lazyModalService.openTrackDeleteModal({
      width: MODAL_DIMENSIONS.TRACK_DELETE_WIDTH,
      data: {
        bulk: true,
        trackIds: selectedIds,
        count: selectedIds.length
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.trackQueryService.refreshTracks();
        this.selectModeSignal.set(false);
      }
    });
  }

  // === CRUD OPERATIONS ===
  public async createTrack(): Promise<void> {
    const dialogRef = await this.lazyModalService.openTrackCreateModal({
      width: MODAL_DIMENSIONS.TRACK_CREATE_WIDTH
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.trackQueryService.refreshTracks();
        this.snackBar.open('Track created successfully', 'Close', {
          duration: UI_TIMING.SNACKBAR_DURATION_MS
        });
      }
    });
  }

  public refreshTracks(): void {
    this.trackQueryService.refreshTracks();
  }

  // === UTILITY METHODS ===
  public isTrackSelected(trackId: string): boolean {
    return this.trackQueryService.isTrackSelected(trackId);
  }

  public getTrackById(id: string): Track | undefined {
    return this.tracks().find(track => track.id === id);
  }

  // === TEMPLATE HELPERS ===
  public get sortOptions(): { value: string; label: string }[] {
    return [
      { value: 'createdAt:desc', label: 'Newest First' },
      { value: 'createdAt:asc', label: 'Oldest First' },
      { value: 'title:asc', label: 'Title A-Z' },
      { value: 'title:desc', label: 'Title Z-A' },
      { value: 'artist:asc', label: 'Artist A-Z' },
      { value: 'artist:desc', label: 'Artist Z-A' }
    ];
  }
}
