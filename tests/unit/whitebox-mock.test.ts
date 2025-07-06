import { describe, it, expect, vi, beforeEach } from 'vitest';

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
}

describe('TrackValidator - Whitebox with mocks', () => {
  let validator: TrackValidator;
  let mockLogger: Logger;
  let logSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logSpy = vi.fn();
    errorSpy = vi.fn();

    mockLogger = {
      log: logSpy,
      error: errorSpy
    };

    validator = new TrackValidator(mockLogger);
  });

  it('should log validation start', () => {
    validator.validateTrack('Test Track', 180);

    expect(logSpy).toHaveBeenCalledWith('Validating track: Test Track');
  });

  it('should return true for valid track', () => {
    const result = validator.validateTrack('Valid Track', 120);

    expect(result).toBe(true);
    expect(logSpy).toHaveBeenCalledWith('Track is valid');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should log error for empty title', () => {
    const result = validator.validateTrack('', 120);

    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('Title cannot be empty');
  });
});
