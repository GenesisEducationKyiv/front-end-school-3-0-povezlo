import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderWidgetComponent } from './widgets/header-widget/header-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderWidgetComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'music-tracks-app';
}
