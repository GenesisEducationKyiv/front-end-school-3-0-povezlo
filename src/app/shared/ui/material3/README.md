# Material 3 UI Components

This library contains UI components implementing the Material 3 design system for Angular applications.

## Components

### Button (`ButtonComponent`)

Button component implementing Material 3 design system.

**Features:**
- 5 design variants: `filled`, `outlined`, `text`, `elevated`, `tonal`
- 3 sizes: `small`, `medium`, `large`
- State support: `disabled`, `loading`
- Full width support
- Accessibility support
- Animations and transitions

**Usage:**
```html
<app-m3-button 
  variant="filled" 
  size="medium"
  [disabled]="false"
  [loading]="false"
  [fullWidth]="false"
  type="button"
  (clicked)="handleClick($event)">
  Click me
</app-m3-button>
```

**Properties:**
- `variant`: `'filled' | 'outlined' | 'text' | 'elevated' | 'tonal'` - button design variant
- `size`: `'small' | 'medium' | 'large'` - button size
- `disabled`: `boolean` - disable button
- `loading`: `boolean` - show loading indicator
- `fullWidth`: `boolean` - stretch button to full width
- `type`: `'button' | 'submit' | 'reset'` - button type
- `testId`: `string` - test identifier

**Events:**
- `clicked`: `EventEmitter<MouseEvent>` - button click event

### Input (`InputComponent`)

Text field component implementing Material 3 design system.

**Features:**
- 2 design variants: `filled`, `outlined`
- Floating label animation
- Support for various input types
- States: `disabled`, `readonly`, `error`
- Validation and helper text
- Accessibility support
- `ControlValueAccessor` for forms integration

**Usage:**
```html
<app-m3-input 
  label="Email" 
  type="email"
  variant="filled"
  [required]="true"
  [disabled]="false"
  [readonly]="false"
  placeholder="Enter your email"
  helperText="Enter your email address"
  [errorMessage]="emailError"
  (valueChange)="onValueChange($event)">
</app-m3-input>
```

**Properties:**
- `variant`: `'filled' | 'outlined'` - field design variant
- `type`: `'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'` - input element type
- `label`: `string` - field label
- `placeholder`: `string` - placeholder text
- `helperText`: `string` - helper text
- `errorMessage`: `string` - error message
- `disabled`: `boolean` - disable field
- `readonly`: `boolean` - read only
- `required`: `boolean` - required field
- `suffixIcon`: `boolean` - show suffix icon slot
- `testId`: `string` - test identifier

**Events:**
- `valueChange`: `EventEmitter<string>` - value change event

### Card (`CardComponent`)

Card component implementing Material 3 design system.

**Features:**
- 3 design variants: `filled`, `outlined`, `elevated`
- Flexible structure with slots (header, media, content, actions)
- Clickable states
- Responsive design
- Accessibility support

**Usage:**
```html
<app-m3-card 
  variant="filled"
  [clickable]="true"
  (cardClick)="handleCardClick($event)">
  
  <div slot="header">
    <h3>Card Title</h3>
    <p>Subtitle</p>
  </div>
  
  <div slot="media">
    <img src="image.jpg" alt="Image">
  </div>
  
  <p>Main card content</p>
  
  <div slot="actions">
    <app-m3-button variant="text">Cancel</app-m3-button>
    <app-m3-button variant="filled">Confirm</app-m3-button>
  </div>
</app-m3-card>
```

**Properties:**
- `variant`: `'filled' | 'outlined' | 'elevated'` - card design variant
- `clickable`: `boolean` - make card clickable
- `testId`: `string` - test identifier

**Events:**
- `cardClick`: `EventEmitter<MouseEvent>` - card click event

## Design Tokens

The library uses CSS custom properties (design tokens) for consistent theming:

### Colors
- `--m3-primary-*` - primary color palette
- `--m3-secondary-*` - secondary color palette
- `--m3-tertiary-*` - tertiary color palette
- `--m3-error-*` - error color palette
- `--m3-neutral-*` - neutral color palette
- `--m3-neutral-variant-*` - neutral variant color palette

### Typography
- `--m3-display-*` - display text styles
- `--m3-headline-*` - headline text styles
- `--m3-title-*` - title text styles
- `--m3-body-*` - body text styles
- `--m3-label-*` - label text styles

### Spacing
- `--m3-spacing-*` - spacing values (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px)

### Border Radius
- `--m3-border-radius-*` - border radius values (4px, 8px, 12px, 16px, 20px, 24px, 28px)

### Elevation
- `--m3-elevation-*` - shadow values for different elevation levels

## Accessibility

All components support accessibility features:
- Proper ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management
- High contrast mode support

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Development

To run Storybook with component examples:

```bash
npm run storybook
```

To build components for production:

```bash
npm run build
```

## Testing

Components are covered by unit tests and integration tests:

```bash
npm run test
```

## Future Plans

- [ ] Add more components (Checkbox, Radio, Switch, etc.)
- [ ] Implement dark theme
- [ ] Add animation system
- [ ] Improve accessibility features
- [ ] Add more design tokens
- [ ] Create component generator CLI 