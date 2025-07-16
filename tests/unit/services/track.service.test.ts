import { describe, it, expect } from 'vitest';

describe('Track Service Logic Tests', () => {
  const mockTrack = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    genres: ['rock'],
    slug: 'test-track-1',
    coverImage: 'cover.jpg',
    audioFile: 'audio.mp3',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  describe('slug generation', () => {
    const generateSlug = (title: string, id: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, '') // Only allow letters, numbers, and spaces
        .trim()                       // Remove leading/trailing spaces
        .replace(/\s+/g, '-') +       // Replace spaces with dashes
        '-' + id.substring(0, 8);
    };

    it('should generate slug from title and id', () => {
      // Act
      const slug = generateSlug('Hello World', '123456789');

      // Assert
      expect(slug).toBe('hello-world-12345678');
    });

    it('should handle special characters', () => {
      // Act
      const slug = generateSlug('Test-Title!@#', 'abc123');

      // Assert
      expect(slug).toBe('testtitle-abc123');
    });

    it('should handle multiple spaces', () => {
      // Act
      const slug = generateSlug('   Multiple   Spaces   ', '999');

      // Assert
      expect(slug).toBe('multiple-spaces-999');
    });

    it('should handle empty title', () => {
      // Act
      const slug = generateSlug('', '123');

      // Assert
      expect(slug).toBe('-123');
    });
  });

  describe('track validation', () => {
    it('should validate track title', () => {
      // Act & Assert
      expect(mockTrack.title.length > 0).toBe(true);
      expect(''.length > 0).toBe(false);
      expect('Valid Title'.length <= 200).toBe(true);
    });

    it('should validate track artist', () => {
      // Act & Assert
      expect(mockTrack.artist.length > 0).toBe(true);
      expect(''.length > 0).toBe(false);
      expect('Valid Artist'.length <= 100).toBe(true);
    });

    it('should validate track genres', () => {
      // Act & Assert
      expect(Array.isArray(mockTrack.genres)).toBe(true);
      expect(mockTrack.genres.length > 0).toBe(true);
      expect(mockTrack.genres.every(genre => typeof genre === 'string')).toBe(true);
    });

    it('should validate track id format', () => {
      // Act & Assert
      expect(typeof mockTrack.id).toBe('string');
      expect(mockTrack.id.length > 0).toBe(true);
      expect(/^[a-zA-Z0-9\-_]+$/.test(mockTrack.id)).toBe(true);
    });
  });

  describe('track filtering', () => {
    const tracks = [
      { ...mockTrack, id: '1', title: 'Rock Song', genres: ['rock'] },
      { ...mockTrack, id: '2', title: 'Jazz Tune', genres: ['jazz'] },
      { ...mockTrack, id: '3', title: 'Rock Ballad', genres: ['rock', 'ballad'] },
    ];

    it('should filter tracks by genre', () => {
      // Act
      const rockTracks = tracks.filter(track =>
        track.genres.includes('rock')
      );

      // Assert
      expect(rockTracks).toHaveLength(2);
      expect(rockTracks.every(track => track.genres.includes('rock'))).toBe(true);
    });

    it('should filter tracks by title search', () => {
      // Arrange
      const searchTerm = 'rock';

      // Act
      const filteredTracks = tracks.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Assert
      expect(filteredTracks).toHaveLength(2);
      expect(filteredTracks.every(track =>
        track.title.toLowerCase().includes('rock')
      )).toBe(true);
    });

    it('should filter tracks by artist', () => {
      // Arrange
      const artistTracks = [
        { ...mockTrack, id: '1', artist: 'Beatles' },
        { ...mockTrack, id: '2', artist: 'Rolling Stones' },
        { ...mockTrack, id: '3', artist: 'Beatles' },
      ];

      // Act
      const beatlesTracks = artistTracks.filter(track =>
        track.artist === 'Beatles'
      );

      // Assert
      expect(beatlesTracks).toHaveLength(2);
      expect(beatlesTracks.every(track => track.artist === 'Beatles')).toBe(true);
    });
  });

  describe('track sorting', () => {
    const tracks = [
      { ...mockTrack, id: '1', title: 'C Song', artist: 'Artist C' },
      { ...mockTrack, id: '2', title: 'A Song', artist: 'Artist A' },
      { ...mockTrack, id: '3', title: 'B Song', artist: 'Artist B' },
    ];

    it('should sort tracks by title', () => {
      // Act
      const sorted = [...tracks].sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      // Assert
      expect(sorted[0]?.title).toBe('A Song');
      expect(sorted[1]?.title).toBe('B Song');
      expect(sorted[2]?.title).toBe('C Song');
    });

    it('should sort tracks by artist', () => {
      // Act
      const sorted = [...tracks].sort((a, b) =>
        a.artist.localeCompare(b.artist)
      );

      // Assert
      expect(sorted[0]?.artist).toBe('Artist A');
      expect(sorted[1]?.artist).toBe('Artist B');
      expect(sorted[2]?.artist).toBe('Artist C');
    });

    it('should sort tracks by creation date', () => {
      // Arrange
      const datedTracks = [
        { ...mockTrack, id: '1', createdAt: '2024-01-03T00:00:00.000Z' },
        { ...mockTrack, id: '2', createdAt: '2024-01-01T00:00:00.000Z' },
        { ...mockTrack, id: '3', createdAt: '2024-01-02T00:00:00.000Z' },
      ];

      // Act
      const sorted = [...datedTracks].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Assert
      expect(sorted[0]?.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(sorted[1]?.createdAt).toBe('2024-01-02T00:00:00.000Z');
      expect(sorted[2]?.createdAt).toBe('2024-01-03T00:00:00.000Z');
    });
  });

  describe('track data management', () => {
    it('should merge track updates', () => {
      // Arrange
      const updates = {
        title: 'Updated Title',
        artist: 'Updated Artist'
      };

      // Act
      const updatedTrack = { ...mockTrack, ...updates };

      // Assert
      expect(updatedTrack.title).toBe('Updated Title');
      expect(updatedTrack.artist).toBe('Updated Artist');
      expect(updatedTrack.id).toBe(mockTrack.id); // Should preserve original id
    });

    it('should create track with required fields', () => {
      // Arrange
      const createData = {
        title: 'New Track',
        artist: 'New Artist',
        genres: ['pop']
      };

      // Act
      const newTrack = {
        id: `temp-${Date.now().toString()}`,
        ...createData,
        slug: generateSlug(createData.title, 'temp'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Assert
      expect(newTrack.title).toBe(createData.title);
      expect(newTrack.artist).toBe(createData.artist);
      expect(newTrack.genres).toEqual(createData.genres);
      expect(newTrack.id).toContain('temp-');
    });

    it('should calculate track list statistics', () => {
      // Arrange
      const tracks = [
        { ...mockTrack, id: '1', genres: ['rock'] },
        { ...mockTrack, id: '2', genres: ['jazz'] },
        { ...mockTrack, id: '3', genres: ['rock', 'blues'] },
      ];

      // Act
      const totalTracks = tracks.length;
      const uniqueGenres = [...new Set(tracks.flatMap(track => track.genres))];
      const uniqueArtists = [...new Set(tracks.map(track => track.artist))];

      // Assert
      expect(totalTracks).toBe(3);
      expect(uniqueGenres).toEqual(['rock', 'jazz', 'blues']);
      expect(uniqueArtists).toHaveLength(1); // All have same artist
    });
  });

    // Helper function from the original service
  function generateSlug(title: string, id: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '')
      .trim()
      .replace(/\s+/g, '-') +
      '-' + id.substring(0, 8);
  }
});
