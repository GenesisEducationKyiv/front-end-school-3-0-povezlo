import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TestIdDirective } from '@app/shared';
import { TrackListWidgetComponent } from '@app/widgets';
import { ActiveTrackWidgetComponent } from '@app/widgets/active-track-widget/active-track-widget.component';

@Component({
  selector: 'app-tracks-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TrackListWidgetComponent,
    ActiveTrackWidgetComponent,
    TestIdDirective,
    MatProgressSpinner,
  ],
  templateUrl: './tracks-page.component.html',
  styleUrl: './tracks-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TracksPageComponent {
  public pageTitle = 'Music Tracks';
}
