import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  QueryParamsService,
  TrackFilters,
  Result,
  Option,
  pipe, TestIdDirective,
} from '@app/shared';
import { TrackService, GenreService, Track } from '@app/entities';

@Component({
  selector: 'app-track-search-with-url',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TestIdDirective,
  ],
  template: `
    <mat-card class="search-card">
      <mat-card-header>
        <mat-card-title>🔍 Searching for tracks with URL parameters (monad option)</mat-card-title>
        <mat-card-subtitle>Demonstration of Option monads with URL parameters</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="search-form">
          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput
                   [formControl]="searchControl"
                   placeholder="Enter the name of the track or artist"
                   [appTestId]="'search-input'">
            <mat-hint>Minimum 2 characters</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Жанр</mat-label>
            <mat-select [formControl]="genreControl" testId="genre-select">
              <mat-option value="">All genres</mat-option>
              <mat-option *ngFor="let genre of genres" [value]="genre">
                {{ genre }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Page</mat-label>
            <input matInput
                   type="number"
                   [formControl]="pageControl"
                   min="1"
                   [appTestId]="'page-input'">
          </mat-form-field>

          <button mat-raised-button
                  color="accent"
                  (click)="clearFilters()"
                  [appTestId]="'clear-filters-btn'">
            Clear filters
          </button>
        </div>

        <!-- Information about current filters -->
        <div class="filters-info">
          <h3>📊 Current filters (from URL):</h3>
          <div class="filter-chips">
            <div class="chip" *ngIf="currentFilters.search | async as search">
              <strong>Search:</strong> {{ Option.getWithDefault(search, 'Нет') }}
            </div>
            <div class="chip" *ngIf="currentFilters.genre | async as genre">
              <strong>Genre:</strong> {{ Option.getWithDefault(genre, 'Все') }}
            </div>
            <div class="chip" *ngIf="currentFilters.page | async as page">
              <strong>Page:</strong> {{ Option.getWithDefault(page, 1) }}
            </div>
          </div>
        </div>

        <!-- Loading tracks... -->
        <div class="search-results">
          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading tracks...</p>
          </div>

          <div *ngIf="errorMessage" class="error">
            <p>❌ {{ errorMessage }}</p>
          </div>

          <div *ngIf="tracks.length > 0 && !loading" class="tracks-list">
            <h3>🎵 Tracks found: {{ tracks.length }}</h3>
            <div class="track-item" *ngFor="let track of tracks" testId="track-item">
              <strong>{{ track.title }}</strong> - {{ track.artist }}
              <span class="genres" *ngIf="track.genres.length > 0">
                ({{ track.genres.join(', ') }})
              </span>
            </div>
          </div>

          <div *ngIf="tracks.length === 0 && !loading && !errorMessage" class="no-results">
            <p>🔍 No search results</p>
            <p>Try changing your search parameters</p>
          </div>
        </div>

        <!-- Demonstration of the use of monads -->
        <div class="monads-demo">
          <h3>🧠 Demonstration of Option monads:</h3>
          <div class="demo-code">
            <code>
              // Validating search via Option monad:<br>
              validSearch = pipe(<br>
              &nbsp;&nbsp;filters.search,<br>
              &nbsp;&nbsp;Option.map(text => text.trim()),<br>
              &nbsp;&nbsp;Option.filter(text => text.length >= 2)<br>
              );<br><br>

              // Default value:<br>
              page = Option.getWithDefault(filters.page, 1);
            </code>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .search-card {
      max-width: 1000px;
      margin: 20px auto;
    }

    .search-form {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-form mat-form-field {
      min-width: 200px;
    }

    .filters-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .filter-chips {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .chip {
      background: #e3f2fd;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
      border: 1px solid #90caf9;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      justify-content: center;
    }

    .error {
      background: #ffebee;
      color: #c62828;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #ef5350;
    }

    .tracks-list {
      background: #e8f5e8;
      padding: 16px;
      border-radius: 8px;
    }

    .track-item {
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
    }

    .track-item:last-child {
      border-bottom: none;
    }

    .genres {
      color: #666;
      font-size: 14px;
    }

    .no-results {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .monads-demo {
      background: #f3e5f5;
      padding: 16px;
      border-radius: 8px;
      margin-top: 24px;
    }

    .demo-code {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      margin-top: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackSearchWithUrlComponent implements OnInit {
  // Form controls
  public searchControl = new FormControl('');
  public genreControl = new FormControl('');
  public pageControl = new FormControl(1);

  // Data
  public tracks: Track[] = [];
  public genres: string[] = [];
  public loading = false;
  public errorMessage = '';

  // Current filters from URL (as observables)
  public currentFilters: {
    search: Promise<Option<string>>;
    genre: Promise<Option<string>>;
    page: Promise<Option<number>>;
  } = {
    search: Promise.resolve(Option.None),
    genre: Promise.resolve(Option.None),
    page: Promise.resolve(Option.None)
  };

  // Services
  private queryParamsService = inject(QueryParamsService);
  private trackService = inject(TrackService);
  private genreService = inject(GenreService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  // Expose Option for template
  public Option = Option;

  ngOnInit(): void {
    this.loadGenres();
    this.setupUrlFiltersHandling();
    this.setupFormControls();
  }

  private setupUrlFiltersHandling(): void {
    // Listening to changes in URL parameters via the Option monad
    this.queryParamsService.getTrackFilters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filters => {
        // Updating information about current filters
        this.updateCurrentFiltersDisplay(filters);

        // Synchronize the form with URL parameters
        this.syncFormWithUrlParams(filters);

        // We perform searches based on URL parameters.
        this.performSearchWithFilters(filters);
      });
  }

  private updateCurrentFiltersDisplay(filters: TrackFilters): void {
    this.currentFilters = {
      search: Promise.resolve(filters.search),
      genre: Promise.resolve(filters.genre),
      page: Promise.resolve(filters.page)
    };
    this.cdr.markForCheck();
  }

  private syncFormWithUrlParams(filters: TrackFilters): void {
    // Синхронизируем форму с URL через Option монады
    pipe(
      filters.search,
      Option.match(
        (search) => { this.searchControl.setValue(search, { emitEvent: false }); },
        () => { this.searchControl.setValue('', { emitEvent: false }); }
      )
    );

    pipe(
      filters.genre,
      Option.match(
        (genre) => { this.genreControl.setValue(genre, { emitEvent: false }); },
        () => { this.genreControl.setValue('', { emitEvent: false }); }
      )
    );

    pipe(
      filters.page,
      Option.match(
        (page) => { this.pageControl.setValue(page, { emitEvent: false }); },
        () => { this.pageControl.setValue(1, { emitEvent: false }); }
      )
    );
  }

  private performSearchWithFilters(filters: TrackFilters): void {
    // Creating parameters for the API using the Option monad
    const apiParams = this.queryParamsService.createApiParams(filters);

    this.loading = true;
    this.errorMessage = '';

    this.trackService.getTracks(apiParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.loading = false;

        Result.match(
          result,
          (response) => {
            this.tracks = response.data;
            this.errorMessage = '';
          },
          (error) => {
            this.tracks = [];
            this.errorMessage = `Ошибка поиска: ${error.message}`;
          }
        );

        this.cdr.markForCheck();
      });
  }

  private setupFormControls(): void {
    // Update the URL when changing the search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(searchValue => {
        this.updateUrlParam('search', searchValue);
      });

    // Update the URL when changing genres
    this.genreControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(genreValue => {
        this.updateUrlParam('genre', genreValue);
      });

    // Refresh URL when changing pages
    this.pageControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pageValue => {
        this.updateUrlParam('page', pageValue);
      });
  }

  private updateUrlParam(paramName: string, value: string | number | null): void {
    // We use the Option monad to validate values
    const validValue = pipe(
      Option.fromNullable(value),
      Option.map(v => String(v).trim()),
      Option.filter(v => v.length > 0),
      Option.match(
        (validStr) => validStr,
        () => null
      )
    );

    void this.queryParamsService.updateQueryParams({
      [paramName]: validValue,
      page: paramName !== 'page' ? 1 : validValue
    });
  }

  private loadGenres(): void {
    this.genreService.getGenres()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        Result.match(
          result,
          (genres) => {
            this.genres = genres;
            this.cdr.markForCheck();
          },
          (error) => {
            console.error('Failed to load genres', error);
          }
        );
      });
  }

  public async clearFilters(): Promise<void> {
    await this.queryParamsService.clearQueryParams();
  }
}
