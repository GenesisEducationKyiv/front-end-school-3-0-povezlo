import { TestBed } from '@angular/core/testing';

import { TrackService } from '@app/entities';

describe('TrackService', () => {
  let service: TrackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
