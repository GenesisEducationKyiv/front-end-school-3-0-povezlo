import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SortOption {
  value: string;
  label: string;
}

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

@Component({
  selector: 'app-track-sort',
  standalone: true,
  imports: [],
  templateUrl: './track-sort.component.html',
  styleUrl: './track-sort.component.scss'
})
export class TrackSortComponent {
  @Input() currentSort: SortConfig = { field: 'createdAt', order: 'desc' };
  @Input() sortOptions: SortOption[] = [
    { value: 'title', label: 'Title' },
    { value: 'artist', label: 'Artist' },
    { value: 'album', label: 'Album' },
    { value: 'createdAt', label: 'Date Added' }
  ];

  @Output() sortChange = new EventEmitter<SortConfig>();

  onSortFieldChange(field: string): void {
    this.sortChange.emit({ ...this.currentSort, field });
  }

  onSortOrderChange(order: 'asc' | 'desc'): void {
    this.sortChange.emit({ ...this.currentSort, order });
  }

  toggleSortOrder(): void {
    const newOrder = this.currentSort.order === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ ...this.currentSort, order: newOrder });
  }
}
