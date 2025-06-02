import { TestBed } from '@angular/core/testing';
import { TrackApiService } from '@app/shared';

describe('TrackApiService', () => {
  let service: TrackApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
