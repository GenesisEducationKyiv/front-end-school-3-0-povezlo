import { z } from 'zod';

// Base schemas
export const TrackIdSchema = z.string();
export const TrackTitleSchema = z.string().min(1).max(200);
export const TrackArtistSchema = z.string().min(1).max(100);
export const TrackAlbumSchema = z.string().max(200).optional();
export const TrackGenresSchema = z.array(z.string()).min(1);
export const TrackSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const TrackCoverImageSchema = z.string().url().optional();
export const TrackAudioFileSchema = z.string().optional();
export const TrackDateSchema = z.string().datetime();

// Track schema
export const TrackSchema = z.object({
  id: TrackIdSchema,
  title: TrackTitleSchema,
  artist: TrackArtistSchema,
  album: TrackAlbumSchema,
  genres: TrackGenresSchema,
  slug: TrackSlugSchema,
  coverImage: TrackCoverImageSchema,
  audioFile: TrackAudioFileSchema,
  createdAt: TrackDateSchema,
  updatedAt: TrackDateSchema,
});

// Track create schema
export const TrackCreateSchema = z.object({
  title: TrackTitleSchema,
  artist: TrackArtistSchema,
  album: TrackAlbumSchema,
  genres: TrackGenresSchema,
  coverImage: TrackCoverImageSchema,
});

// Track update schema
export const TrackUpdateSchema = TrackCreateSchema.partial();

// Pagination meta schema
export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  totalPages: z.number().int().min(0),
});

// Paginated tracks response schema
export const PaginatedTracksResponseSchema = z.object({
  data: z.array(TrackSchema),
  meta: PaginationMetaSchema,
});

// Bulk delete response schema
export const BulkDeleteResponseSchema = z.object({
  success: z.array(z.string()),
  failed: z.array(z.string()),
});

// Type exports
export type Track = z.infer<typeof TrackSchema>;
export type TrackCreate = z.infer<typeof TrackCreateSchema>;
export type TrackUpdate = z.infer<typeof TrackUpdateSchema>;
export type PaginatedTracksResponse = z.infer<typeof PaginatedTracksResponseSchema>;
export type BulkDeleteResponse = z.infer<typeof BulkDeleteResponseSchema>;
