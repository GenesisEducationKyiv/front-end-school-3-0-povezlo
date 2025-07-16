import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'filled' | 'outlined' | 'elevated';

/**
 * Material 3 Card component
 * 
 * Implements Material 3 design system for cards
 * Supports various variants: filled, outlined, elevated
 */
@Component({
  selector: 'app-m3-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses" [attr.data-testid]="testId">
      <!-- Card header -->
      <div *ngIf="hasHeader" class="card-header">
        <ng-content select="[slot=header]"></ng-content>
      </div>
      
      <!-- Media content -->
      <div *ngIf="hasMedia" class="card-media">
        <ng-content select="[slot=media]"></ng-content>
      </div>
      
      <!-- Main content -->
      <div *ngIf="hasContent" class="card-content">
        <ng-content></ng-content>
      </div>
      
      <!-- Actions -->
      <div *ngIf="hasActions" class="card-actions">
        <ng-content select="[slot=actions]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() variant: CardVariant = 'filled';
  @Input() clickable = false;
  @Input() disabled = false;
  @Input() testId?: string;
  @Input() hasHeader = false;
  @Input() hasMedia = false;
  @Input() hasContent = true;
  @Input() hasActions = false;

  get cardClasses(): string {
    const classes = [
      'card',
      `card--${this.variant}`,
    ];

    if (this.clickable) classes.push('card--clickable');
    if (this.disabled) classes.push('card--disabled');

    return classes.join(' ');
  }
} 