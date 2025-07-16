import type { Meta, StoryObj } from '@storybook/angular';
import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Material 3/Card',
  component: CardComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Material 3 Card Component

Card component implementing Material 3 design system.

## Features:
- 3 design variants: filled, outlined, elevated
- Flexible structure with slots: header, media, content, actions
- Clickable state support
- Responsive design
- Accessibility support
- Various content layouts

## Usage:
\`\`\`html
<app-m3-card variant="filled" [hasHeader]="true" [hasActions]="true">
  <div slot="header">
    <h3>Card Title</h3>
    <p>Subtitle</p>
  </div>
  
  <p>Main card content</p>
  
  <div slot="actions">
    <button>Action 1</button>
    <button>Action 2</button>
  </div>
</app-m3-card>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'elevated'],
      description: 'Card design variant',
    },
    clickable: {
      control: { type: 'boolean' },
      description: 'Makes the card clickable',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the card',
    },
    hasHeader: {
      control: { type: 'boolean' },
      description: 'Show header section',
    },
    hasMedia: {
      control: { type: 'boolean' },
      description: 'Show media section',
    },
    hasContent: {
      control: { type: 'boolean' },
      description: 'Show content section',
    },
    hasActions: {
      control: { type: 'boolean' },
      description: 'Show actions section',
    },
  },
  args: {
    variant: 'filled',
    clickable: false,
    disabled: false,
    hasHeader: false,
    hasMedia: false,
    hasContent: true,
    hasActions: false,
  },
};

export default meta;
type Story = StoryObj<CardComponent>;

// Basic variants
export const Filled: Story = {
  args: {
    variant: 'filled',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-m3-card 
          [variant]="variant"
          [clickable]="clickable"
          [disabled]="disabled"
          [hasHeader]="hasHeader"
          [hasMedia]="hasMedia"
          [hasContent]="hasContent"
          [hasActions]="hasActions">
          <h3>Filled Card</h3>
          <p>This is an example of a filled card with basic content. It uses surface-container background color.</p>
        </app-m3-card>
      </div>
    `,
  }),
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-m3-card 
          [variant]="variant"
          [clickable]="clickable"
          [disabled]="disabled"
          [hasHeader]="hasHeader"
          [hasMedia]="hasMedia"
          [hasContent]="hasContent"
          [hasActions]="hasActions">
          <h3>Outlined Card</h3>
          <p>This is an example of an outlined card. It has a transparent background and border.</p>
        </app-m3-card>
      </div>
    `,
  }),
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-m3-card 
          [variant]="variant"
          [clickable]="clickable"
          [disabled]="disabled"
          [hasHeader]="hasHeader"
          [hasMedia]="hasMedia"
          [hasContent]="hasContent"
          [hasActions]="hasActions">
          <h3>Elevated Card</h3>
          <p>This is an example of an elevated card with shadow. It creates a sense of depth.</p>
        </app-m3-card>
      </div>
    `,
  }),
};

// All variants
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div style="width: 280px;">
          <app-m3-card variant="filled">
            <h3>Filled Card</h3>
            <p>Filled card with surface-container background</p>
          </app-m3-card>
        </div>
        
        <div style="width: 280px;">
          <app-m3-card variant="outlined">
            <h3>Outlined Card</h3>
            <p>Outlined card with transparent background</p>
          </app-m3-card>
        </div>
        
        <div style="width: 280px;">
          <app-m3-card variant="elevated">
            <h3>Elevated Card</h3>
            <p>Elevated card with shadow</p>
          </app-m3-card>
        </div>
      </div>
    `,
  }),
};

// Card with Header
export const WithHeader: Story = {
  render: () => ({
    template: `
      <div style="width: 350px;">
        <app-m3-card variant="filled" [hasHeader]="true">
          <div slot="header">
            <h3>Card Title</h3>
            <p>Subtitle with additional information</p>
          </div>
          
          <p>Main card content is placed here. It can contain any information.</p>
        </app-m3-card>
      </div>
    `,
  }),
};

// Card with Media
export const WithMedia: Story = {
  render: () => ({
    template: `
      <div style="width: 350px;">
        <app-m3-card variant="outlined" [hasMedia]="true">
          <div slot="media">
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop" alt="Example image" style="width: 100%; height: 200px; object-fit: cover;">
          </div>
          
          <h3>Card with Image</h3>
          <p>This card contains an image in the media section. The image automatically adjusts to the card width.</p>
        </app-m3-card>
      </div>
    `,
  }),
};

// Card with actions
export const WithActions: Story = {
  render: () => ({
    template: `
      <div style="width: 350px;">
        <app-m3-card variant="elevated" [hasActions]="true">
          <h3>Card with Actions</h3>
          <p>This card contains action buttons at the bottom. Actions are usually positioned on the right.</p>
          
          <div slot="actions">
            <button style="background: transparent; border: 1px solid var(--md-sys-color-primary); color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">Cancel</button>
            <button style="background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Confirm</button>
          </div>
        </app-m3-card>
      </div>
    `,
  }),
};

// Full card
export const FullCard: Story = {
  render: () => ({
    template: `
      <div style="width: 400px;">
        <app-m3-card variant="filled" [hasHeader]="true" [hasMedia]="true" [hasActions]="true">
          <div slot="header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
              <div>
                <h4 style="margin: 0; font-size: 16px;">John Doe</h4>
                <p style="margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant);">2 hours ago</p>
              </div>
            </div>
          </div>
          
          <div slot="media">
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop" alt="Post image" style="width: 100%; height: 250px; object-fit: cover;">
          </div>
          
          <h3>Beautiful Sunset</h3>
          <p>Today I managed to capture an incredible sunset. Nature amazes with its beauty every day!</p>
          
          <div slot="actions">
            <button style="background: transparent; border: none; color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">❤️ Like</button>
            <button style="background: transparent; border: none; color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">💬 Comment</button>
            <button style="background: transparent; border: none; color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">📤 Share</button>
          </div>
        </app-m3-card>
      </div>
    `,
  }),
};

// Clickable cards
export const ClickableCards: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div style="width: 280px;">
          <app-m3-card variant="filled" [clickable]="true">
            <h3>Clickable Card</h3>
            <p>This card responds to clicks and hover effects</p>
          </app-m3-card>
        </div>
        
        <div style="width: 280px;">
          <app-m3-card variant="outlined" [clickable]="true">
            <h3>Outlined + Clickable</h3>
            <p>Outlined card with interactivity</p>
          </app-m3-card>
        </div>
        
        <div style="width: 280px;">
          <app-m3-card variant="elevated" [clickable]="true">
            <h3>Elevated + Clickable</h3>
            <p>Elevated interactive card</p>
          </app-m3-card>
        </div>
      </div>
    `,
  }),
};

// Card states
export const CardStates: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div style="width: 280px;">
          <app-m3-card variant="filled">
            <h3>Normal Card</h3>
            <p>Card in normal state</p>
          </app-m3-card>
        </div>
        
        <div style="width: 280px;">
          <app-m3-card variant="filled" [clickable]="true">
            <h3>Clickable Card</h3>
            <p>Hover for effect</p>
          </app-m3-card>
        </div>
        
        <div style="width: 280px;">
          <app-m3-card variant="filled" [disabled]="true">
            <h3>Disabled Card</h3>
            <p>Card in disabled state</p>
          </app-m3-card>
        </div>
      </div>
    `,
  }),
};

// Product cards
export const ProductCards: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 900px;">
        <app-m3-card variant="outlined" [hasMedia]="true" [hasActions]="true" [clickable]="true">
          <div slot="media">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop" alt="Product 1" style="width: 100%; height: 200px; object-fit: cover;">
          </div>
          
          <h3>Premium Headphones</h3>
          <p style="color: var(--md-sys-color-primary); font-weight: 500; font-size: 18px; margin: 8px 0;">$159.99</p>
          <p>High-quality wireless headphones with active noise cancellation</p>
          
          <div slot="actions">
            <button style="background: transparent; border: 1px solid var(--md-sys-color-primary); color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">Add to Wishlist</button>
            <button style="background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Buy Now</button>
          </div>
        </app-m3-card>
        
        <app-m3-card variant="outlined" [hasMedia]="true" [hasActions]="true" [clickable]="true">
          <div slot="media">
            <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=200&fit=crop" alt="Product 2" style="width: 100%; height: 200px; object-fit: cover;">
          </div>
          
          <h3>Galaxy Smartphone</h3>
          <p style="color: var(--md-sys-color-primary); font-weight: 500; font-size: 18px; margin: 8px 0;">$459.99</p>
          <p>Modern smartphone with excellent camera and fast charging</p>
          
          <div slot="actions">
            <button style="background: transparent; border: 1px solid var(--md-sys-color-primary); color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">Add to Wishlist</button>
            <button style="background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Buy Now</button>
          </div>
        </app-m3-card>
        
        <app-m3-card variant="outlined" [hasMedia]="true" [hasActions]="true" [clickable]="true">
          <div slot="media">
            <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop" alt="Product 3" style="width: 100%; height: 200px; object-fit: cover;">
          </div>
          
          <h3>Pro Laptop</h3>
          <p style="color: var(--md-sys-color-primary); font-weight: 500; font-size: 18px; margin: 8px 0;">$899.99</p>
          <p>Powerful laptop for work and creativity with excellent display</p>
          
          <div slot="actions">
            <button style="background: transparent; border: 1px solid var(--md-sys-color-primary); color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">Add to Wishlist</button>
            <button style="background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Buy Now</button>
          </div>
        </app-m3-card>
      </div>
    `,
  }),
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: 'filled',
    clickable: false,
    disabled: false,
    hasHeader: false,
    hasMedia: false,
    hasContent: true,
    hasActions: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 350px;">
        <app-m3-card 
          [variant]="variant"
          [clickable]="clickable"
          [disabled]="disabled"
          [hasHeader]="hasHeader"
          [hasMedia]="hasMedia"
          [hasContent]="hasContent"
          [hasActions]="hasActions">
          
          <div *ngIf="hasHeader" slot="header">
            <h3>Customizable Header</h3>
            <p>Card subtitle</p>
          </div>
          
          <div *ngIf="hasMedia" slot="media">
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop" alt="Example" style="width: 100%; height: 200px; object-fit: cover;">
          </div>
          
          <div *ngIf="hasContent">
            <h3>Interactive Card</h3>
            <p>Use the controls on the right to customize the card. Try different variants and states.</p>
          </div>
          
          <div *ngIf="hasActions" slot="actions">
            <button style="background: transparent; border: 1px solid var(--md-sys-color-primary); color: var(--md-sys-color-primary); padding: 8px 16px; border-radius: 20px; cursor: pointer;">Action 1</button>
            <button style="background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">Action 2</button>
          </div>
        </app-m3-card>
      </div>
    `,
  }),
};