import type { Meta, StoryObj } from '@storybook/angular';
import { InputComponent } from './input.component';

const meta: Meta<InputComponent> = {
  title: 'Material 3/Input',
  component: InputComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Material 3 Input (TextField) Component

Text field component implementing Material 3 design system.

## Features:
- 2 design variants: filled, outlined
- Floating label animation
- Support for various input types
- States: disabled, readonly, error
- Validation and helper text
- Accessibility support
- ControlValueAccessor for forms integration

## Usage:
\`\`\`html
<app-m3-input 
  label="Email" 
  type="email"
  variant="filled"
  [required]="true"
  helperText="Enter your email address"
  (valueChange)="onValueChange($event)">
</app-m3-input>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined'],
      description: 'Field design variant',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Input element type',
    },
    label: {
      control: { type: 'text' },
      description: 'Field label',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    helperText: {
      control: { type: 'text' },
      description: 'Helper text',
    },
    errorMessage: {
      control: { type: 'text' },
      description: 'Error message',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable field',
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Read only',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Required field',
    },
    suffixIcon: {
      control: { type: 'boolean' },
      description: 'Show suffix icon slot',
    },
  },
  args: {
    variant: 'filled',
    type: 'text',
    label: 'Field name',
    placeholder: '',
    helperText: '',
    errorMessage: '',
    disabled: false,
    readonly: false,
    required: false,
    suffixIcon: false,
  },
};

export default meta;
type Story = StoryObj<InputComponent>;

// Basic options
export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Filled Input',
    helperText: 'This is a completed input field',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-m3-input 
          [variant]="variant" 
          [type]="type"
          [label]="label"
          [placeholder]="placeholder"
          [helperText]="helperText"
          [errorMessage]="errorMessage"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [suffixIcon]="suffixIcon"
          (valueChange)="onValueChange($event)">
        </app-m3-input>
      </div>
    `,
  }),
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    label: 'Outlined Input',
    helperText: 'This is an input field with a stroke',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-m3-input 
          [variant]="variant" 
          [type]="type"
          [label]="label"
          [placeholder]="placeholder"
          [helperText]="helperText"
          [errorMessage]="errorMessage"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [suffixIcon]="suffixIcon"
          (valueChange)="onValueChange($event)">
        </app-m3-input>
      </div>
    `,
  }),
};

// Different types
export const InputTypes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px; width: 300px;">
        <app-m3-input variant="filled" type="text" label="Text Input" helperText="Regular text"></app-m3-input>
        <app-m3-input variant="filled" type="email" label="Email Input" helperText="Email address"></app-m3-input>
        <app-m3-input variant="filled" type="password" label="Password Input" helperText="Password"></app-m3-input>
        <app-m3-input variant="filled" type="number" label="Number Input" helperText="Numbers only"></app-m3-input>
        <app-m3-input variant="filled" type="tel" label="Phone Input" helperText="Phone number"></app-m3-input>
        <app-m3-input variant="filled" type="search" label="Search Input" helperText="Search"></app-m3-input>
      </div>
    `,
  }),
};

// States
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px; width: 300px;">
        <app-m3-input variant="filled" label="Normal State" helperText="Normal state"></app-m3-input>
        <app-m3-input variant="filled" label="Required Field" [required]="true" helperText="Required field"></app-m3-input>
        <app-m3-input variant="filled" label="Disabled State" [disabled]="true" helperText="Disabled field"></app-m3-input>
        <app-m3-input variant="filled" label="Readonly State" [readonly]="true" helperText="Read only"></app-m3-input>
        <app-m3-input variant="filled" label="Error State" errorMessage="This field contains an error"></app-m3-input>
      </div>
    `,
  }),
};

// Comparison of options
export const VariantComparison: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 32px;">
        <div style="flex: 1;">
          <h3 style="margin-bottom: 24px; font-size: 16px; color: var(--md-sys-color-on-surface);">Filled Variant</h3>
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <app-m3-input variant="filled" label="Name" helperText="Enter your name"></app-m3-input>
            <app-m3-input variant="filled" label="Email" type="email" [required]="true" helperText="Required field"></app-m3-input>
            <app-m3-input variant="filled" label="Password" type="password" helperText="Minimum 8 characters"></app-m3-input>
            <app-m3-input variant="filled" label="Error Example" errorMessage="Invalid value"></app-m3-input>
          </div>
        </div>
        <div style="flex: 1;">
          <h3 style="margin-bottom: 24px; font-size: 16px; color: var(--md-sys-color-on-surface);">Outlined Variant</h3>
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <app-m3-input variant="outlined" label="Name" helperText="Enter your name"></app-m3-input>
            <app-m3-input variant="outlined" label="Email" type="email" [required]="true" helperText="Required field"></app-m3-input>
            <app-m3-input variant="outlined" label="Password" type="password" helperText="Minimum 8 characters"></app-m3-input>
            <app-m3-input variant="outlined" label="Error Example" errorMessage="Invalid value"></app-m3-input>
          </div>
        </div>
      </div>
    `,
  }),
};

// Registration form
export const RegistrationForm: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px; padding: 24px; border-radius: 12px; background: var(--md-sys-color-surface-container-low);">
        <h2 style="margin: 0 0 32px 0; font-size: 24px; color: var(--md-sys-color-on-surface);">Registration</h2>
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div style="display: flex; gap: 16px;">
            <app-m3-input variant="outlined" label="Name" [required]="true" helperText="Your name"></app-m3-input>
            <app-m3-input variant="outlined" label="Surname" [required]="true" helperText="Your last name"></app-m3-input>
          </div>
          <app-m3-input variant="outlined" label="Email" type="email" [required]="true" helperText="We're not spamming"></app-m3-input>
          <app-m3-input variant="outlined" label="Phone" type="tel" helperText="To contact you"></app-m3-input>
          <app-m3-input variant="outlined" label="Password" type="password" [required]="true" helperText="Minimum 8 characters"></app-m3-input>
          <app-m3-input variant="outlined" label="Password confirmation" type="password" [required]="true" helperText="Repeat the password"></app-m3-input>
        </div>
      </div>
    `,
  }),
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: 'filled',
    type: 'text',
    label: 'Interactive field',
    helperText: 'Try different settings',
  },
  render: (args) => ({
    props: {
      ...args,
      onValueChange: (value: string) => { console.log('Value changed:', value); },
    },
    template: `
      <div style="width: 300px;">
        <app-m3-input 
          [variant]="variant" 
          [type]="type"
          [label]="label"
          [placeholder]="placeholder"
          [helperText]="helperText"
          [errorMessage]="errorMessage"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [suffixIcon]="suffixIcon"
          (valueChange)="onValueChange($event)">
        </app-m3-input>
      </div>
    `,
  }),
}; 