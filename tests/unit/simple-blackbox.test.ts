import { describe, it, expect } from 'vitest';

// Simple function for blackbox testing demonstration
function calculatePlaylistDuration(tracks: { duration: number }[]): number {
  return tracks.reduce((total, track) => total + track.duration, 0);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const hourStr = hours.toString();
  const minuteStr = minutes.toString().padStart(2, '0');
  const secStr = secs.toString().padStart(2, '0');
  const minuteStrNoLeading = minutes.toString();

  if (hours > 0) {
    return `${hourStr}:${minuteStr}:${secStr}`;
  }
  return `${minuteStrNoLeading}:${secStr}`;
}

describe('Music Utilities - Blackbox Testing', () => {

  describe('calculatePlaylistDuration', () => {
    it('should return 0 for empty playlist', () => {
      const result = calculatePlaylistDuration([]);
      expect(result).toBe(0);
    });

    it('should correctly calculate duration of single track', () => {
      const tracks = [{ duration: 180 }]; // 3 minutes
      const result = calculatePlaylistDuration(tracks);
      expect(result).toBe(180);
    });

    it('should correctly calculate total duration of multiple tracks', () => {
      const tracks = [
        { duration: 120 }, // 2 minutes
        { duration: 180 }, // 3 minutes
        { duration: 240 }  // 4 minutes
      ];
      const result = calculatePlaylistDuration(tracks);
      expect(result).toBe(540); // 9 minutes
    });

    it('should handle tracks with zero duration', () => {
      const tracks = [
        { duration: 0 },
        { duration: 120 },
        { duration: 0 }
      ];
      const result = calculatePlaylistDuration(tracks);
      expect(result).toBe(120);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds in MM:SS format', () => {
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should format time over an hour in HH:MM:SS format', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    it('should correctly add leading zeros', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3605)).toBe('1:00:05');
    });
  });

  // Example of integration blackbox test
  it('should correctly process complete playlist scenario', () => {
    const playlist = [
      { duration: 210 }, // 3:30
      { duration: 180 }, // 3:00
      { duration: 240 }  // 4:00
    ];

    const totalDuration = calculatePlaylistDuration(playlist);
    const formattedDuration = formatDuration(totalDuration);

    expect(totalDuration).toBe(630);
    expect(formattedDuration).toBe('10:30');
  });
});
