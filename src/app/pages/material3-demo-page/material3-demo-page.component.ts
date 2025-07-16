import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/ui/material3/button/button.component';
import { InputComponent } from '../../shared/ui/material3/input/input.component';
import { CardComponent } from '../../shared/ui/material3/card/card.component';

/**
 * Material 3 components demonstration page
 */
@Component({
  selector: 'app-material3-demo-page',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="demo-page">
      <header class="demo-header">
        <h1>Material 3 Design System</h1>
        <p>Demonstration of components created according to Material 3 design system</p>
      </header>

              <!-- Buttons Section -->
        <section class="demo-section">
          <h2>Buttons</h2>
          <p>Various button variants with Material 3 design</p>
        
        <div class="component-showcase">
          <div class="showcase-group">
            <h3>Button Variants</h3>
            <div class="button-group">
              <app-m3-button variant="filled" (clicked)="onButtonClick('filled')">Filled</app-m3-button>
              <app-m3-button variant="outlined" (clicked)="onButtonClick('outlined')">Outlined</app-m3-button>
              <app-m3-button variant="text" (clicked)="onButtonClick('text')">Text</app-m3-button>
              <app-m3-button variant="elevated" (clicked)="onButtonClick('elevated')">Elevated</app-m3-button>
              <app-m3-button variant="tonal" (clicked)="onButtonClick('tonal')">Tonal</app-m3-button>
            </div>
          </div>

          <div class="showcase-group">
            <h3>Button Sizes</h3>
            <div class="button-group">
              <app-m3-button variant="filled" size="small" (clicked)="onButtonClick('small')">Small</app-m3-button>
              <app-m3-button variant="filled" size="medium" (clicked)="onButtonClick('medium')">Medium</app-m3-button>
              <app-m3-button variant="filled" size="large" (clicked)="onButtonClick('large')">Large</app-m3-button>
            </div>
          </div>

          <div class="showcase-group">
            <h3>Button States</h3>
            <div class="button-group">
              <app-m3-button variant="filled" (clicked)="onButtonClick('normal')">Normal</app-m3-button>
              <app-m3-button variant="filled" [disabled]="true" (clicked)="onButtonClick('disabled')">Disabled</app-m3-button>
              <app-m3-button variant="filled" [loading]="true" (clicked)="onButtonClick('loading')">Loading</app-m3-button>
            </div>
          </div>
        </div>
      </section>

              <!-- Inputs Section -->
        <section class="demo-section">
          <h2>Input Fields</h2>
          <p>Text fields with support for various types and states</p>
        
        <div class="component-showcase">
          <div class="showcase-group">
            <h3>Field Variants</h3>
            <div class="input-group">
              <app-m3-input 
                variant="filled" 
                label="Filled Input" 
                helperText="Filled input field"
                (valueChange)="onInputChange('filled', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="outlined" 
                label="Outlined Input" 
                helperText="Outlined input field"
                (valueChange)="onInputChange('outlined', $event)">
              </app-m3-input>
            </div>
          </div>

          <div class="showcase-group">
            <h3>Field Types</h3>
            <div class="input-group">
              <app-m3-input 
                variant="filled" 
                type="email" 
                label="Email" 
                helperText="Enter email address"
                [required]="true"
                (valueChange)="onInputChange('email', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="filled" 
                type="password" 
                label="Password" 
                helperText="Minimum 8 characters"
                [required]="true"
                (valueChange)="onInputChange('password', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="filled" 
                type="number" 
                label="Number" 
                helperText="Numbers only"
                (valueChange)="onInputChange('number', $event)">
              </app-m3-input>
            </div>
          </div>

          <div class="showcase-group">
            <h3>Field States</h3>
            <div class="input-group">
              <app-m3-input 
                variant="outlined" 
                label="Normal State" 
                helperText="Normal state"
                (valueChange)="onInputChange('normal', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="outlined" 
                label="Disabled State" 
                helperText="Disabled field"
                [disabled]="true"
                (valueChange)="onInputChange('disabled', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="outlined" 
                label="Error State" 
                errorMessage="This field contains an error"
                (valueChange)="onInputChange('error', $event)">
              </app-m3-input>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards Section -->
      <section class="demo-section">
        <h2>Cards</h2>
        <p>Flexible cards with various layouts and states</p>
        
        <div class="component-showcase">
          <div class="showcase-group">
            <h3>Card Variants</h3>
            <div class="card-group">
              <app-m3-card variant="filled" style="width: 280px;">
                <h3>Filled Card</h3>
                <p>Filled card with surface-container background for content highlighting.</p>
              </app-m3-card>
              
              <app-m3-card variant="outlined" style="width: 280px;">
                <h3>Outlined Card</h3>
                <p>Outlined card with transparent background for easy perception.</p>
              </app-m3-card>
              
              <app-m3-card variant="elevated" style="width: 280px;">
                <h3>Elevated Card</h3>
                <p>Elevated card with shadow to create depth sensation.</p>
              </app-m3-card>
            </div>
          </div>

          <div class="showcase-group">
            <h3>Cards с контентом</h3>
            <div class="card-group">
              <app-m3-card variant="outlined" [hasHeader]="true" [hasActions]="true" style="width: 320px;">
                <div slot="header">
                  <h3>Card with Header</h3>
                  <p>Additional information in subtitle</p>
                </div>
                
                <p>Main card content with detailed functionality description.</p>
                
                <div slot="actions">
                  <app-m3-button variant="text" size="small" (clicked)="onCardAction('cancel')">Cancel</app-m3-button>
                  <app-m3-button variant="filled" size="small" (clicked)="onCardAction('confirm')">Confirm</app-m3-button>
                </div>
              </app-m3-card>

              <app-m3-card variant="filled" [hasMedia]="true" [hasActions]="true" style="width: 320px;">
                <div slot="media">
                  <div style="width: 100%; height: 180px; background: linear-gradient(45deg, var(--md-sys-color-primary), var(--md-sys-color-secondary)); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
                    Media Content
                  </div>
                </div>
                
                <h3>Card with Media</h3>
                <p>Card with Media-контентом и действиями для интерактивности.</p>
                
                <div slot="actions">
                  <app-m3-button variant="text" size="small" (clicked)="onCardAction('like')">❤️ Like</app-m3-button>
                  <app-m3-button variant="text" size="small" (clicked)="onCardAction('share')">📤 Share</app-m3-button>
                </div>
              </app-m3-card>
            </div>
          </div>

          <div class="showcase-group">
            <h3>Interactive Cards</h3>
            <div class="card-group">
              <app-m3-card variant="elevated" [clickable]="true" style="width: 280px;" (click)="onCardClick('clickable-1')">
                <h3>Clickable Card</h3>
                <p>This card responds to clicks and hover effects. Try clicking!</p>
              </app-m3-card>
              
              <app-m3-card variant="outlined" [clickable]="true" style="width: 280px;" (click)="onCardClick('clickable-2')">
                <h3>Hover Effects</h3>
                <p>Hover to view animation and interaction effects.</p>
              </app-m3-card>
            </div>
          </div>
        </div>
      </section>

      <!-- Combined Example -->
      <section class="demo-section">
        <h2>Combined Example</h2>
        <p>Example of using all components together</p>
        
        <div class="combined-example">
          <app-m3-card variant="outlined" [hasHeader]="true" [hasActions]="true" style="max-width: 500px; margin: 0 auto;">
            <div slot="header">
              <h3>Feedback Form</h3>
              <p>Please fill out the form below</p>
            </div>
            
            <div class="form-content">
              <app-m3-input 
                variant="outlined" 
                label="Name" 
                helperText="Your full name"
                [required]="true"
                (valueChange)="onFormChange('name', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="outlined" 
                type="email" 
                label="Email" 
                helperText="To contact you"
                [required]="true"
                (valueChange)="onFormChange('email', $event)">
              </app-m3-input>
              
              <app-m3-input 
                variant="outlined" 
                label="Message" 
                helperText="Describe your question or suggestion"
                [required]="true"
                (valueChange)="onFormChange('message', $event)">
              </app-m3-input>
            </div>
            
            <div slot="actions">
              <app-m3-button variant="text" (clicked)="onFormAction('clear')">Clear</app-m3-button>
              <app-m3-button variant="filled" (clicked)="onFormAction('submit')">Submit</app-m3-button>
            </div>
          </app-m3-card>
        </div>
      </section>
    </div>
  `,
  styleUrl: './material3-demo-page.component.scss'
})
export class Material3DemoPageComponent {
  onButtonClick(variant: string): void {
    console.log(`Button clicked: ${variant}`);
  }

  onInputChange(field: string, value: string): void {
    console.log(`Input changed: ${field} = ${value}`);
  }

  onCardClick(cardId: string): void {
    console.log(`Card clicked: ${cardId}`);
  }

  onCardAction(action: string): void {
    console.log(`Card action: ${action}`);
  }

  onFormChange(field: string, value: string): void {
    console.log(`Form field changed: ${field} = ${value}`);
  }

  onFormAction(action: string): void {
    console.log(`Form action: ${action}`);
  }
} 