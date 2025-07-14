import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputVariant = 'filled' | 'outlined';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

/**
 * Material 3 Input (TextField) component
 * 
 * Implements Material 3 design system for text fields
 * Supports various variants: filled, outlined
 */
@Component({
  selector: 'app-m3-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div [class]="containerClasses">
      <label *ngIf="label" [for]="inputId" [class]="labelClasses">
        {{ label }}
                 <span *ngIf="required" class="required-asterisk" aria-label="Required field">*</span>
      </label>
      
      <div class="input-container">
        <input
          [id]="inputId"
          [type]="type"
          [class]="inputClasses"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [value]="value"
          [attr.aria-label]="ariaLabel || label"
          [attr.aria-describedby]="helperTextId"
          [attr.aria-invalid]="hasError"
          [attr.data-testid]="testId"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        />
        
        <!-- Суффикс иконка -->
        <div *ngIf="suffixIcon" class="suffix-icon">
          <ng-content select="[slot=suffix]"></ng-content>
        </div>
      </div>
      
      <!-- Текст помощи или ошибки -->
      <div *ngIf="helperText || errorMessage" [id]="helperTextId" [class]="helperClasses">
        {{ errorMessage || helperText }}
      </div>
    </div>
  `,
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() variant: InputVariant = 'filled';
  @Input() type: InputType = 'text';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() suffixIcon = false;
  @Input() ariaLabel?: string;
  @Input() testId?: string;

  @Output() valueChange = new EventEmitter<string>();
  @Output() inputFocus = new EventEmitter<FocusEvent>();
  @Output() inputBlur = new EventEmitter<FocusEvent>();

  value = '';
  focused = false;
  inputId = `input-${Math.random().toString(36).slice(2, 11)}`;
  helperTextId = `helper-${this.inputId}`;

  private onChange = (value: string): void => {
    console.log('onChange', value);
    // Будет переопределено через registerOnChange
  };
  
  private onTouched = (): void => {
    // Будет переопределено через registerOnTouched
  };

  get hasError(): boolean {
    return this.errorMessage !== '';
  }

  get hasValue(): boolean {
    return this.value !== '';
  }

  get containerClasses(): string {
    const classes = [
      'input-field',
      `input-field--${this.variant}`,
    ];

    if (this.focused) classes.push('input-field--focused');
    if (this.hasError) classes.push('input-field--error');
    if (this.disabled) classes.push('input-field--disabled');
    if (this.hasValue || this.focused) classes.push('input-field--has-value');

    return classes.join(' ');
  }

  get labelClasses(): string {
    const classes = ['input-label'];
    
    if (this.hasValue || this.focused) classes.push('input-label--floating');
    if (this.hasError) classes.push('input-label--error');
    if (this.disabled) classes.push('input-label--disabled');

    return classes.join(' ');
  }

  get inputClasses(): string {
    const classes = ['input-element'];
    
    if (this.hasError) classes.push('input-element--error');
    if (this.disabled) classes.push('input-element--disabled');

    return classes.join(' ');
  }

  get helperClasses(): string {
    const classes = ['helper-text'];
    
    if (this.hasError) classes.push('helper-text--error');

    return classes.join(' ');
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onFocus(): void {
    this.focused = true;
    this.inputFocus.emit();
  }

  onBlur(): void {
    this.focused = false;
    this.onTouched();
    this.inputBlur.emit();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
} 