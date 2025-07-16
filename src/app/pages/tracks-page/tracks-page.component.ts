import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TestIdDirective } from '@app/shared';
import { TrackListWidgetComponent } from '@app/widgets';

@Component({
  selector: 'app-tracks-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TrackListWidgetComponent,
    TestIdDirective,
  ],
  templateUrl: './tracks-page.component.html',
  styleUrl: './tracks-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TracksPageComponent {
  public pageTitle = 'Music Tracks';
}
