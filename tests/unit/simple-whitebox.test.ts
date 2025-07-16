import { describe, it, expect, vi, beforeEach } from 'vitest';

// Interfaces for demonstration
interface Track {
  id: string;
  title: string;
  duration: number;
}

interface AudioPlayer {
  play(track: Track): void;
  pause(): void;
  getCurrentTrack(): Track | null;
}

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// Class for whitebox testing demonstration
class PlaylistManager {
  private currentTrack: Track | null = null;
  private tracks: Track[] = [];

  constructor(
    private audioPlayer: AudioPlayer,
    private logger: Logger
  ) {}

  addTrack(track: Track): void {
    this.logger.log(`Adding track: ${track.title}`);
    this.tracks.push(track);
  }

  playTrack(trackId: string): boolean {
    const track = this.tracks.find(t => t.id === trackId);

    if (track == null) {
      this.logger.error(`Track not found: ${trackId}`);
      return false;
    }

    try {
      this.audioPlayer.play(track);
      this.currentTrack = track;
      this.logger.log(`Playing: ${track.title}`);
      return true;
    } catch {
      this.logger.error(`Failed to play track: ${track.title}`);
      return false;
    }
  }

  pauseCurrentTrack(): void {
    if (this.currentTrack != null) {
      this.audioPlayer.pause();
      this.logger.log(`Paused: ${this.currentTrack.title}`);
    }
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getTrackCount(): number {
    return this.tracks.length;
  }

  // Private method for internal logic testing demonstration
  private validateTrack(track: Track): boolean {
    return track.title.length > 0 && track.duration > 0;
  }

  // Public method that uses private one
  addValidatedTrack(track: Track): boolean {
    if (!this.validateTrack(track)) {
      this.logger.error(`Invalid track: ${track.title}`);
      return false;
    }

    this.addTrack(track);
    return true;
  }
}

describe('PlaylistManager - Whitebox Testing with mocks', () => {
  let playlistManager: PlaylistManager;
  let mockAudioPlayer: AudioPlayer;
  let mockLogger: Logger;
  let audioPlaySpy: ReturnType<typeof vi.fn>;
  let audioPauseSpy: ReturnType<typeof vi.fn>;
  let logSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  const sampleTrack: Track = {
    id: '1',
    title: 'Test Track',
    duration: 180
  };

  beforeEach(() => {
    // Create spy functions
    audioPlaySpy = vi.fn();
    audioPauseSpy = vi.fn();
    logSpy = vi.fn();
    errorSpy = vi.fn();

    // Create mocks using spy functions
    mockAudioPlayer = {
      play: audioPlaySpy,
      pause: audioPauseSpy,
      getCurrentTrack: vi.fn()
    };

    mockLogger = {
      log: logSpy,
      error: errorSpy
    };

    playlistManager = new PlaylistManager(mockAudioPlayer, mockLogger);
  });

  describe('addTrack', () => {
    it('should add track and log it', () => {
      playlistManager.addTrack(sampleTrack);

      // Check that log method was called with correct parameters
      expect(logSpy).toHaveBeenCalledWith('Adding track: Test Track');
      expect(logSpy).toHaveBeenCalledTimes(1);

      // Check that track was added
      expect(playlistManager.getTrackCount()).toBe(1);
    });
  });

  describe('playTrack', () => {
    beforeEach(() => {
      playlistManager.addTrack(sampleTrack);
    });

    it('should successfully play existing track', () => {
      const result = playlistManager.playTrack('1');

      // Check interaction with dependencies
      expect(audioPlaySpy).toHaveBeenCalledWith(sampleTrack);
      expect(logSpy).toHaveBeenCalledWith('Playing: Test Track');

      // Check return value
      expect(result).toBe(true);

      // Check internal state
      expect(playlistManager.getCurrentTrack()).toEqual(sampleTrack);
    });

    it('should log error for non-existent track', () => {
      const result = playlistManager.playTrack('nonexistent');

      // Check that audio player was NOT called
      expect(audioPlaySpy).not.toHaveBeenCalled();

      // Check error logging
      expect(errorSpy).toHaveBeenCalledWith('Track not found: nonexistent');

      // Check return value
      expect(result).toBe(false);
    });

    it('should handle playback error', () => {
      // Configure mock to throw error
      audioPlaySpy.mockImplementation(() => {
        throw new Error('Audio error');
      });

      const result = playlistManager.playTrack('1');

      // Check that error was handled
      expect(errorSpy).toHaveBeenCalledWith('Failed to play track: Test Track');
      expect(result).toBe(false);
    });
  });

  describe('pauseCurrentTrack', () => {
    it('should pause current track', () => {
      // Set up state
      playlistManager.addTrack(sampleTrack);
      playlistManager.playTrack('1');

      // Clear previous calls for test clarity
      vi.clearAllMocks();

      playlistManager.pauseCurrentTrack();

      // Check method calls
      expect(audioPauseSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Paused: Test Track');
    });

    it('should do nothing if no current track', () => {
      playlistManager.pauseCurrentTrack();

      // Check that no methods were called
      expect(audioPauseSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('addValidatedTrack', () => {
    it('should add valid track', () => {
      const result = playlistManager.addValidatedTrack(sampleTrack);

      expect(result).toBe(true);
      expect(logSpy).toHaveBeenCalledWith('Adding track: Test Track');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should reject track with empty title', () => {
      const invalidTrack = { ...sampleTrack, title: '' };

      const result = playlistManager.addValidatedTrack(invalidTrack);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith('Invalid track: ');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should reject track with zero duration', () => {
      const invalidTrack = { ...sampleTrack, duration: 0 };

      const result = playlistManager.addValidatedTrack(invalidTrack);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith('Invalid track: Test Track');
    });
  });

  describe('mock integration', () => {
    it('should work correctly with sequential operations', () => {
      // Add track
      playlistManager.addTrack(sampleTrack);

      // Play it
      playlistManager.playTrack('1');

      // Pause it
      playlistManager.pauseCurrentTrack();

      // Check that all methods were called in correct order
      expect(logSpy).toHaveBeenNthCalledWith(1, 'Adding track: Test Track');
      expect(logSpy).toHaveBeenNthCalledWith(2, 'Playing: Test Track');
      expect(logSpy).toHaveBeenNthCalledWith(3, 'Paused: Test Track');

      expect(audioPlaySpy).toHaveBeenCalledTimes(1);
      expect(audioPauseSpy).toHaveBeenCalledTimes(1);
    });
  });
});

// Simple class for whitebox testing demonstration
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

class TrackValidator {
  constructor(private logger: Logger) {}

  validateTrack(title: string, duration: number): boolean {
    this.logger.log(`Validating track: ${title}`);

    if (title.length === 0) {
      this.logger.error('Title cannot be empty');
      return false;
    }

    if (duration <= 0) {
      this.logger.error('Duration must be positive');
      return false;
    }

    this.logger.log('Track is valid');
    return true;
  }

  processTrack(title: string, duration: number): string | null {
    if (!this.validateTrack(title, duration)) {
      return null;
    }

    return `${title} (${this.formatDuration(duration)})`;
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const minutesStr = minutes.toString();
    const secsStr = secs.toString().padStart(2, '0');
    return `${minutesStr}:${secsStr}`;
  }
}

describe('TrackValidator - Whitebox Testing with mocks', () => {
  let validator: TrackValidator;
  let mockLogger: Logger;
  let logSpy2: ReturnType<typeof vi.fn>;
  let errorSpy2: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logSpy2 = vi.fn();
    errorSpy2 = vi.fn();

    mockLogger = {
      log: logSpy2,
      error: errorSpy2
    };

    validator = new TrackValidator(mockLogger);
  });

  describe('validateTrack', () => {
      it('should log validation start', () => {
    validator.validateTrack('Test Track', 180);

    expect(logSpy2).toHaveBeenCalledWith('Validating track: Test Track');
  });

  it('should return true for valid track', () => {
    const result = validator.validateTrack('Valid Track', 120);

    expect(result).toBe(true);
    expect(logSpy2).toHaveBeenCalledWith('Track is valid');
    expect(errorSpy2).not.toHaveBeenCalled();
  });

  it('should log error for empty title', () => {
    const result = validator.validateTrack('', 120);

    expect(result).toBe(false);
    expect(errorSpy2).toHaveBeenCalledWith('Title cannot be empty');
  });

  it('should log error for negative duration', () => {
    const result = validator.validateTrack('Track', -5);

    expect(result).toBe(false);
    expect(errorSpy2).toHaveBeenCalledWith('Duration must be positive');
  });
  });

  describe('processTrack', () => {
    it('should process valid track', () => {
      const result = validator.processTrack('My Song', 185);

      expect(result).toBe('My Song (3:05)');
      expect(logSpy2).toHaveBeenCalledTimes(2); // Validation + success
    });

    it('should return null for invalid track', () => {
      const result = validator.processTrack('', 120);

      expect(result).toBeNull();
      expect(errorSpy2).toHaveBeenCalled();
    });
  });

  describe('mock interaction verification', () => {
    it('should call logger methods in correct order', () => {
      validator.validateTrack('Test', 100);

      expect(logSpy2).toHaveBeenNthCalledWith(1, 'Validating track: Test');
      expect(logSpy2).toHaveBeenNthCalledWith(2, 'Track is valid');
    });

    it('should count number of calls', () => {
      validator.validateTrack('Track1', 100);
      validator.validateTrack('Track2', 200);

      expect(logSpy2).toHaveBeenCalledTimes(4); // 2 validations + 2 successes
    });
  });
});
