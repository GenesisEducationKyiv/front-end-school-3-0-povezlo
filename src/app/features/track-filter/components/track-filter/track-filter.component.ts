import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FilterOptions {
  search?: string;
  genre?: string;
  artist?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Component({
  selector: 'app-track-filter',
  standalone: true,
  imports: [],
  templateUrl: './track-filter.component.html',
  styleUrl: './track-filter.component.scss'
})
export class TrackFilterComponent {
  @Input() genres: string[] = [];
  @Input() artists: string[] = [];
  @Input() currentFilters: FilterOptions = {};

  @Output() filtersChange = new EventEmitter<FilterOptions>();

  onSearchChange(search: string): void {
    this.filtersChange.emit({ ...this.currentFilters, search });
  }

  onGenreChange(genre: string): void {
    this.filtersChange.emit({ ...this.currentFilters, genre });
  }

  onArtistChange(artist: string): void {
    this.filtersChange.emit({ ...this.currentFilters, artist });
  }

  onSortChange(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.filtersChange.emit({ ...this.currentFilters, sortBy, sortOrder });
  }

  clearFilters(): void {
    this.filtersChange.emit({});
  }
}
