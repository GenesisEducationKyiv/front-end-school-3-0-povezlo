/**
 * Constants for TanStack Query configuration
 */

// Cache timing constants (in milliseconds)
export const QUERY_CACHE_TIMES = {
  // Default stale time for queries
  DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes

  // Default garbage collection time
  DEFAULT_GC_TIME: 10 * 60 * 1000, // 10 minutes

  // Genre-specific cache times (genres change rarely)
  GENRE_STALE_TIME: 10 * 60 * 1000, // 10 minutes
  GENRE_GC_TIME: 30 * 60 * 1000, // 30 minutes

  // Track prefetch stale time
  TRACK_PREFETCH_STALE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

// Pagination constants
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 0,
  DEFAULT_LIMIT: 10,
  MIN_PAGE: 0,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
} as const;

// UI timing constants
export const UI_TIMING = {
  SEARCH_DEBOUNCE_MS: 300,
  SNACKBAR_DURATION_MS: 3000,
} as const;

// Modal dimensions
export const MODAL_DIMENSIONS = {
  TRACK_EDIT_WIDTH: '500px',
  TRACK_CREATE_WIDTH: '500px',
  TRACK_UPLOAD_WIDTH: '500px',
  TRACK_DELETE_WIDTH: '400px',
} as const;

// Default sort configuration
export const SORT_DEFAULTS = {
  DEFAULT_SORT_FIELD: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc' as const,
} as const;
