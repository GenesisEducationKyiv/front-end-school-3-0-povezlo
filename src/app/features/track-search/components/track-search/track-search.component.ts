import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { assertDefined } from '@app/shared';

@Component({
  selector: 'app-track-search',
  standalone: true,
  imports: [],
  templateUrl: './track-search.component.html',
  styleUrl: './track-search.component.scss'
})
export class TrackSearchComponent {
  @Input() placeholder = 'Search tracks...';
  @Input() debounceTime = 300;
  @Input() value = '';

  @Output() searchChange = new EventEmitter<string>();

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchChange.emit(searchTerm);
    });
  }

  onInput(event: Event): void {
    assertDefined(event.target, 'Event target must be defined');
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.searchSubject.next(input.value);
  }

  clearSearch(): void {
    this.value = '';
    this.searchChange.emit('');
  }
}
