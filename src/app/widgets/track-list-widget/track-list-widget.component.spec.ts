import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TrackListWidgetComponent } from './track-list-widget.component';

describe('TrackListWidgetComponent', () => {
  let component: TrackListWidgetComponent;
  let fixture: ComponentFixture<TrackListWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackListWidgetComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideTanStackQuery(new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        })),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackListWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
