import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Material 3 Button component
 * 
 * Implements Material 3 design system for buttons
 * Supports various variants: filled, outlined, text, elevated, tonal
 */
@Component({
  selector: 'app-m3-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="buttonClasses"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick($event)"
      [attr.aria-label]="ariaLabel"
      [attr.data-testid]="testId"
    >
      <ng-container *ngIf="loading; else contentTemplate">
        <span class="loading-indicator" aria-hidden="true"></span>
        <span class="sr-only">Loading...</span>
      </ng-container>
      
      <ng-template #contentTemplate>
        <ng-content></ng-content>
      </ng-template>
    </button>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'filled';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel?: string;
  @Input() testId?: string;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = [
      'btn',
      `btn--${this.variant}`,
      `btn--${this.size}`,
    ];

    if (this.disabled) classes.push('btn--disabled');
    if (this.loading) classes.push('btn--loading');
    if (this.fullWidth) classes.push('btn--full-width');

    return classes.join(' ');
  }

  onClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
} 