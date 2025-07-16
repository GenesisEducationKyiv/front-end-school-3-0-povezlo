import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="image-container" [class.loaded]="loaded">
      <img
        [ngSrc]="src"
        [alt]="alt"
        [width]="width"
        [height]="height"
        [priority]="priority"
        [sizes]="sizes"
        (load)="onLoad()"
        (error)="onError()"
        *ngIf="!error"
      />
      <img
        [src]="fallbackSrc"
        [alt]="alt"
        [width]="width"
        [height]="height"
        *ngIf="error"
        class="fallback-image"
      />
    </div>
  `,
  styles: [`
    .image-container {
      position: relative;
      overflow: hidden;
      background-color: #f5f5f5;
      transition: opacity 0.3s ease-in-out;
    }

    .image-container:not(.loaded) {
      opacity: 0.8;
    }

    .image-container.loaded {
      opacity: 1;
      background-color: transparent;
    }

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }

    .fallback-image {
      filter: grayscale(100%);
      opacity: 0.5;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedImageComponent implements OnInit {
  @Input() src!: string;
  @Input() alt = '';
  @Input() width = 300;
  @Input() height = 300;
  @Input() priority = false;
  @Input() fallbackSrc = '/assets/images/default-cover.svg';
  @Input() sizes = '';
  
  loaded = false;
  error = false;

  ngOnInit(): void {
    if (this.sizes === '') {
      this.sizes = this.generateDefaultSizes();
    }
  }

  onLoad(): void {
    this.loaded = true;
  }

  onError(): void {
    this.error = true;
    // Quietly handle image loading errors without console logging
  }

  private generateDefaultSizes(): string {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
}