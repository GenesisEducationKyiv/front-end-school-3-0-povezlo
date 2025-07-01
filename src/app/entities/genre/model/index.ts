export * from './genre';
export * from './genre-query.service';

// Re-export GenreQueryService as GenreService for backward compatibility
export { GenreQueryService as GenreService } from './genre-query.service';
