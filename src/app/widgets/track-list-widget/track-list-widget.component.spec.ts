import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackListWidgetComponent } from '@app/widgets';

describe('TrackListWidgetComponent', () => {
  let component: TrackListWidgetComponent;
  let fixture: ComponentFixture<TrackListWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackListWidgetComponent]
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
