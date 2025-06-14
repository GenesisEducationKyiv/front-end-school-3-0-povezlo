import * as Belt from '@mobily/ts-belt';
import { pipe } from '@mobily/ts-belt';
import { Observable, of, catchError, map } from 'rxjs';

// Re-export основных типов для удобства
export type Result<T, E> = Belt.Result<T, E>;
export type Option<T> = Belt.Option<T>;

// === WRAPPER FUNCTIONS ===
export const createOk = <T>(value: T): Result<T, never> => {
  return Belt.R.Ok(value as NonNullable<T>);
};

export const createError = <E>(error: E): Result<never, E> => {
  return Belt.R.Error(error as NonNullable<E>);
};

// === RESULT (Either) MONAD ===
export const Result = {
  // Constructors (wrapper functions)
  Ok: createOk,
  Error: createError,

  // Inspections
  isOk: Belt.R.isOk,
  isError: Belt.R.isError,

  // Transformations
  map: Belt.R.map,
  mapError: Belt.R.mapError,
  flatMap: Belt.R.flatMap,

  // Obtaining values
  getExn: Belt.R.getExn,
  getWithDefault: Belt.R.getWithDefault,

  // Pattern matching
  match: Belt.R.match,

  // Side effects
  tap: Belt.R.tap,
  tapError: Belt.R.tapError,

  // Utilities for Observable
  fromObservable: <T, E>(observable: Observable<T>, errorMapper?: (error: unknown) => E): Observable<Result<T, E>> => {
    return observable.pipe(
      map((value) => createOk(value) as Result<T, E>),
      catchError((error) => {
        const mappedError = errorMapper != null ? errorMapper(error) : error as E;
        return of(createError(mappedError) as Result<T, E>);
      })
    );
  },

  toObservable: <T, E>(result: Result<T, E>): Observable<T> => {
    return Belt.R.match(
      result,
      (value) => of(value),
      (error) => {
        throw new Error(String(error));
      }
    );
  }
};

// === OPTION (Maybe) MONAD ===
export const Option = {
  // Designers
  Some: Belt.O.Some,
  None: Belt.O.None,
  fromNullable: Belt.O.fromNullable,
  fromFalsy: Belt.O.fromFalsy,

  // Inspections
  isSome: Belt.O.isSome,
  isNone: Belt.O.isNone,

  // Transformations
  map: Belt.O.map,
  flatMap: Belt.O.flatMap,
  filter: Belt.O.filter,

  // Obtaining values
  getExn: Belt.O.getExn,
  getWithDefault: Belt.O.getWithDefault,

  // Pattern matching
  match: Belt.O.match,

  // Side effects
  tap: Belt.O.tap,

  // Domain-specific utilities
  fromQueryParam: (param: string | null): Option<string> => {
    return pipe(
      Belt.O.fromNullable(param),
      Belt.O.map(p => p.trim()),
      Belt.O.filter(p => p.length > 0)
    );
  },

  fromQueryParamNumber: (param: string | null): Option<number> => {
    return pipe(
      Option.fromQueryParam(param),
      Belt.O.flatMap(p => {
        const num = Number(p);
        return !isNaN(num) && isFinite(num) ? Belt.O.Some(num) : Belt.O.None;
      })
    );
  },

  fromEmail: (email: string | null): Option<string> => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pipe(
      Belt.O.fromNullable(email),
      Belt.O.map(e => e.trim()),
      Belt.O.filter(e => EMAIL_REGEX.test(e))
    );
  }
};

// === PIPE UTILITY ===
export { pipe };

// === Domain-specific utilities ===

// Track validation
export const TrackValidation = {
  validateTitle: (title: string | null): Option<string> => {
    return pipe(
      Belt.O.fromNullable(title),
      Belt.O.map(t => t.trim()),
      Belt.O.filter(t => t.length >= 1 && t.length <= 100)
    );
  },

  validateArtist: (artist: string | null): Option<string> => {
    return pipe(
      Belt.O.fromNullable(artist),
      Belt.O.map(a => a.trim()),
      Belt.O.filter(a => a.length >= 1 && a.length <= 50)
    );
  },

  validateGenres: (genres: string[] | null): Option<string[]> => {
    return pipe(
      Belt.O.fromNullable(genres),
      Belt.O.filter(g => g.length > 0 && g.length <= 5)
    );
  }
};

// Filter utilities
export const QueryFilters = {
  extractSearchQuery: (queryParams: Record<string, unknown>): Option<string> => {
    return Option.fromQueryParam(queryParams['search'] as string | null);
  },

  extractGenreFilter: (queryParams: Record<string, unknown>): Option<string> => {
    return Option.fromQueryParam(queryParams['genre'] as string | null);
  },

  extractArtistFilter: (queryParams: Record<string, unknown>): Option<string> => {
    return Option.fromQueryParam(queryParams['artist'] as string | null);
  },

  extractPageNumber: (queryParams: Record<string, unknown>): Option<number> => {
    return pipe(
      Option.fromQueryParamNumber(queryParams['page'] as string | null),
      Belt.O.filter(p => p >= 1)
    );
  },

  extractPageSize: (queryParams: Record<string, unknown>): Option<number> => {
    return pipe(
      Option.fromQueryParamNumber(queryParams['limit'] as string | null),
      Belt.O.filter(l => l >= 1 && l <= 100)
    );
  },

  extractSortOrder: (queryParams: Record<string, unknown>): Option<'asc' | 'desc'> => {
    return pipe(
      Option.fromQueryParam(queryParams['order'] as string | null),
      Belt.O.filter(o => o === 'asc' || o === 'desc'),
      Belt.O.map(o => o as 'asc' | 'desc')
    );
  }
};

export enum TrackErrorType {
  FetchError = 'track_fetch_error',
  CreateError = 'track_create_error',
  UpdateError = 'track_update_error',
  DeleteError = 'track_delete_error',
  ValidationError = 'track_validation_error',
  NotFoundError = 'track_not_found_error'
}

export enum GenreErrorType {
  FetchError = 'genre_fetch_error',
  NotFoundError = 'genre_not_found_error'
}

// Combinators for complex operations
export const Combinators = {
  // Combine several options into a single object
  combineOptions: <T extends Record<string, unknown>>(
    options: { [K in keyof T]: Option<T[K]> }
  ): Option<T> => {
    const keys = Object.keys(options) as (keyof T)[];
    const result = {} as T;

    for (const key of keys) {
      const option = options[key];
      if (Belt.O.isNone(option)) {
        return Belt.O.None;
      }
      result[key] = Belt.O.getExn(option) as T[typeof key];
    }

    return Belt.O.Some(result);
  },

  // Combine several Result objects into one object
  combineResults: <T extends Record<string, unknown>, E>(
    results: { [K in keyof T]: Result<T[K], E> }
  ): Result<T, E> => {
    const keys = Object.keys(results) as (keyof T)[];
    const result = {} as T;

    for (const key of keys) {
      const res = results[key];
      if (Belt.R.isError(res)) {
        return res;
      }
      result[key] = Belt.R.getExn(res);
    }

    return Belt.R.Ok(result);
  }
};
