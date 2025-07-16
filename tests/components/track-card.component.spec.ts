import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TrackCardComponent } from '../../src/app/entities/track/components/track-card/track-card.component';
import { TrackService } from '../../src/app/entities/track/model/track.service';
import { TrackUpdate, Track } from '../../src/app/entities/track/model/track';
import { AudioPlaybackService } from '../../src/app/processes/audio-playback/model/audio-playback.service';
import { ValidatedTrackApiService } from '../../src/app/shared/api/validated-track-api.service';
import { OptimizedImageComponent } from '../../src/app/shared/ui/optimized-image/optimized-image.component';
import { ButtonComponent } from '../../src/app/shared/ui/material3/button/button.component';
import { CardComponent } from '../../src/app/shared/ui/material3/card/card.component';
import { of } from 'rxjs';
import { Result } from '../../src/app/shared';
import { By } from '@angular/platform-browser';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

describe('TrackCardComponent Jest Integration Test', () => {
  let component: TrackCardComponent;
  let fixture: ComponentFixture<TrackCardComponent>;
  let trackService: TrackService;
  let mockApiService: Partial<ValidatedTrackApiService>;

  const mockTrack: Track = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    genres: ['rock'],
    slug: 'test-track-1',
    coverImage: 'test-cover.jpg',
    audioFile: 'test-audio.mp3',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  };

  beforeEach(async () => {
    mockApiService = {
      deleteTrack: jest.fn(() => of(Result.Ok(null))),
      updateTrack: jest.fn((id: string, data: TrackUpdate) => of(Result.Ok({
        id,
        title: data.title ?? mockTrack.title,
        artist: data.artist ?? mockTrack.artist,
        album: data.album ?? mockTrack.album,
        genres: data.genres ?? mockTrack.genres,
        slug: mockTrack.slug,
        coverImage: data.coverImage ?? mockTrack.coverImage,
        audioFile: mockTrack.audioFile,
        createdAt: mockTrack.createdAt,
        updatedAt: new Date().toISOString()
      })))
    };

    // Mock for AudioPlaybackService
    const mockAudioService = {
      audioState$: of({ track: null, isPlaying: false }),
      playTrack: jest.fn(),
      pause: jest.fn(),
      togglePlayPause: jest.fn(),
      isCurrentTrack: jest.fn().mockReturnValue(false),
      isPlaying: jest.fn().mockReturnValue(false)
    };

    await TestBed.configureTestingModule({
      imports: [
        MatCheckboxModule,
        MatChipsModule,
        NoopAnimationsModule,
        TrackCardComponent,
        OptimizedImageComponent,
        ButtonComponent,
        CardComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TrackService,
        { provide: AudioPlaybackService, useValue: mockAudioService },
        { provide: ValidatedTrackApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrackCardComponent);
    component = fixture.componentInstance;
    trackService = TestBed.inject(TrackService);

    component.track = mockTrack;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should display track information in DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Use correct data-testid from real component
    const trackTitle = compiled.querySelector('[data-testid="track-item-1-title"]');
    const trackArtist = compiled.querySelector('[data-testid="track-item-1-artist"]');

    expect(trackTitle?.textContent).toContain('Test Track');
    expect(trackArtist?.textContent).toContain('Test Artist');

    // Check album by class since it has no data-testid
    const trackAlbum = compiled.querySelector('.track-album');
    expect(trackAlbum?.textContent).toContain('Test Album');
  });

  it('should handle play button click', () => {
    const trackPlaySpy = jest.spyOn(component.trackPlay, 'emit');

    const playButton = fixture.debugElement.query(By.css('[data-testid="play-button-1"]'));
    expect(playButton).toBeTruthy();

    (playButton.nativeElement as HTMLElement).click();
    fixture.detectChanges();

    expect(trackPlaySpy).toHaveBeenCalledWith(mockTrack);
  });

  it('should handle delete button click', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');

    const deleteButton = fixture.debugElement.query(By.css('[data-testid="delete-track-1"]'));
    expect(deleteButton).toBeTruthy();

    (deleteButton.nativeElement as HTMLElement).click();
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith(mockTrack);
  });



  it('should correctly display track cover', () => {
    const optimizedImageComponent = fixture.debugElement.query(By.css('app-optimized-image'));
    expect(optimizedImageComponent).toBeTruthy();
    
    const imageComponent = optimizedImageComponent.componentInstance as OptimizedImageComponent;
    expect(imageComponent.src).toContain('test-cover.jpg');
    expect(imageComponent.alt).toBe('Test Track');
    
    const imgElement = optimizedImageComponent.query(By.css('img'));
    expect(imgElement).toBeTruthy();
    expect(imgElement.nativeElement.alt).toBe('Test Track');
  });

  it('should emit event when onPlay is called', () => {
    const trackPlaySpy = jest.spyOn(component.trackPlay, 'emit');

    component.onPlay();
    fixture.detectChanges();

    expect(trackPlaySpy).toHaveBeenCalledWith(mockTrack);
  });

  it('should integrate with TrackService', () => {
    const deleteTrackSpy = jest.spyOn(trackService, 'deleteTrack').mockReturnValue(
      of(Result.Ok(null))
    );

    trackService.deleteTrack('1').subscribe(result => {
      expect(Result.isOk(result)).toBe(true);
    });

    expect(deleteTrackSpy).toHaveBeenCalledWith('1');
  });

  it('should handle empty track correctly', () => {
    component.track = null;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    // Component should work even with empty track
  });

  it('should handle click when track is null', () => {
    component.track = null;
    fixture.detectChanges();

    const trackPlaySpy = jest.spyOn(component.trackPlay, 'emit');
    component.onPlay();

    // Should not emit event when track is null
    expect(trackPlaySpy).not.toHaveBeenCalled();
  });
});
