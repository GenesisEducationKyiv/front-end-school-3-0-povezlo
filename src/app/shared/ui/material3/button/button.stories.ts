import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Material 3/Button',
  component: ButtonComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Material 3 Button Component

Button component implementing Material 3 design system.

## Features:
- 5 design variants: filled, outlined, text, elevated, tonal
- 3 sizes: small, medium, large
- State support: disabled, loading
- Full width
- Accessibility support
- Animations and transitions

## Usage:
\`\`\`html
<app-m3-button 
  variant="filled" 
  size="medium"
  (clicked)="handleClick($event)">
  Click me
</app-m3-button>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'text', 'elevated', 'tonal'],
      description: 'Button design variant',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Show loading indicator',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Stretch button to full width',
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'Button type',
    },
    clicked: {
      description: 'Button click event',
    },
  },
  args: {
    variant: 'filled',
    size: 'medium',
    disabled: false,
    loading: false,
    fullWidth: false,
    type: 'button',
    clicked: () => { console.log('Button clicked'); },
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

// Basic options
export const Filled: Story = {
  args: {
    variant: 'filled',
  },
  render: (args) => ({
    props: args,
    template: `<app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Filled Button</app-m3-button>`,
  }),
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
  render: (args) => ({
    props: args,
    template: `<app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Outlined Button</app-m3-button>`,
  }),
};

export const Text: Story = {
  args: {
    variant: 'text',
  },
  render: (args) => ({
    props: args,
    template: `<app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Text Button</app-m3-button>`,
  }),
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => ({
    props: args,
    template: `<app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Elevated Button</app-m3-button>`,
  }),
};

export const Tonal: Story = {
  args: {
    variant: 'tonal',
  },
  render: (args) => ({
    props: args,
    template: `<app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Tonal Button</app-m3-button>`,
  }),
};

// Dimensions
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <app-m3-button variant="filled" size="small" (clicked)="clicked($event)">Small</app-m3-button>
        <app-m3-button variant="filled" size="medium" (clicked)="clicked($event)">Medium</app-m3-button>
        <app-m3-button variant="filled" size="large" (clicked)="clicked($event)">Large</app-m3-button>
      </div>
    `,
    props: {
      clicked: () => { console.log('Button clicked'); },
    },
  }),
};

// States
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <app-m3-button variant="filled" (clicked)="clicked($event)">Normal</app-m3-button>
        <app-m3-button variant="filled" [disabled]="true" (clicked)="clicked($event)">Disabled</app-m3-button>
        <app-m3-button variant="filled" [loading]="true" (clicked)="clicked($event)">Loading</app-m3-button>
      </div>
    `,
    props: {
      clicked: () => { console.log('Button clicked'); },
    },
  }),
};

// All options
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; gap: 16px; align-items: center;">
          <app-m3-button variant="filled" (clicked)="clicked($event)">Filled</app-m3-button>
          <app-m3-button variant="outlined" (clicked)="clicked($event)">Outlined</app-m3-button>
          <app-m3-button variant="text" (clicked)="clicked($event)">Text</app-m3-button>
          <app-m3-button variant="elevated" (clicked)="clicked($event)">Elevated</app-m3-button>
          <app-m3-button variant="tonal" (clicked)="clicked($event)">Tonal</app-m3-button>
        </div>
        <div style="display: flex; gap: 16px; align-items: center;">
          <app-m3-button variant="filled" [disabled]="true" (clicked)="clicked($event)">Disabled</app-m3-button>
          <app-m3-button variant="outlined" [disabled]="true" (clicked)="clicked($event)">Disabled</app-m3-button>
          <app-m3-button variant="text" [disabled]="true" (clicked)="clicked($event)">Disabled</app-m3-button>
          <app-m3-button variant="elevated" [disabled]="true" (clicked)="clicked($event)">Disabled</app-m3-button>
          <app-m3-button variant="tonal" [disabled]="true" (clicked)="clicked($event)">Disabled</app-m3-button>
        </div>
      </div>
    `,
    props: {
      clicked: () => { console.log('Button clicked'); },
    },
  }),
};

// Full width
export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Full Width Button</app-m3-button>
      </div>
    `,
  }),
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: 'filled',
    size: 'medium',
    disabled: false,
    loading: false,
    fullWidth: false,
  },
  render: (args) => ({
    props: args,
    template: `<app-m3-button [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth" [type]="type" (clicked)="clicked($event)">Настраиваемая кнопка</app-m3-button>`,
  }),
}; 