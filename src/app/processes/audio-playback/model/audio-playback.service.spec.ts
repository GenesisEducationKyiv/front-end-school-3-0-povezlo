import { TestBed } from '@angular/core/testing';
import { AudioPlaybackService } from '@app/processes';

describe('AudioPlaybackService', () => {
  let service: AudioPlaybackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioPlaybackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
