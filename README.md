# Music Tracks App

A modern Angular application for managing music tracks with a clean, responsive UI built with Angular Material and **functional programming** using **ts-belt monads**.

## Overview

Music Tracks App is a comprehensive solution for managing music tracks with **functional programming approach**. This single-page application allows users to create, edit, delete, and search tracks in a library. It features audio playback with visualization, bulk operations, responsive design, and **type-safe error handling** using **Either(Result)** and **Maybe(Option)** monads from **ts-belt**.

## Features

### Track Management

- Create tracks with title, artist, album, and genre information
- Edit existing tracks to update metadata
- Delete tracks individually or in bulk
- Upload audio files (MP3, WAV, OGG) for tracks
- Optimistic UI updates for smooth user experience
- **NEW**: Functional error handling with Result monads

### Music Player

- Play/pause audio tracks with robust error handling
- Audio visualization with waveform display
- Volume control with mute toggle
- Progress tracking with timeline seeking
- Persistent volume settings between sessions
- **NEW**: Complete functional programming approach with Result monads
- **NEW**: Zero try-catch constructions - pure functional error handling
- **NEW**: Type-safe audio operations using ts-belt Either pattern

### Search & Filtering with URL Integration

- Search by title, artist, or album with URL synchronization
- Filter by genre or artist with persistent URL state
- Sort by various fields (title, artist, album, date added)
- Pagination for large track collections
- **NEW**: URL parameter handling using Option monads
- **NEW**: Type-safe nullable value processing with ts-belt Maybe pattern
- **NEW**: Functional composition with pipe() for URL filtering

### UI Features

- Responsive design works on both desktop and mobile
- Material Design components
- Dark UI theme
- Loading indicators for asynchronous operations
- Toast notifications for operation feedback
- **NEW**: Comprehensive error boundaries with user-friendly messages

## Technical Overview

### Architecture

The project follows a clean, modular architecture based on feature-first organization with **functional programming principles**:

- **Entities**: Core business objects (Track, Genre) with Result monads
- **Features**: Specific user-facing functionality with Option/Result handling
- **Pages**: Application routes and layout containers
- **Widgets**: Reusable composite components with functional error handling
- **Shared**: Common utilities, services, and UI components
- **Processes**: Application-wide business processes (audio playback) using Result pattern

### Tech Stack

- **Angular 18**: Latest version with standalone components
- **RxJS**: Reactive programming for async operations
- **Angular Material**: UI component library
- **WaveSurfer.js**: Audio visualization
- **TypeScript**: Static typing and modern JavaScript features
- **Zod**: Runtime type validation with Result integration
- **ts-belt**: Functional programming library for monads (Either/Maybe patterns)

### Key Design Patterns

- **Functional Programming**: Pure functions with monadic error handling
- **Either(Result) Pattern**: All server operations return `Observable<Result<T, E>>`
- **Maybe(Option) Pattern**: URL parameters handled with `Option<T>` monads
- **Optimistic Updates**: UI updates immediately while backend catches up
- **Reactive State Management**: Observable-based state handling
- **Dependency Injection**: Service composition
- **Component Composition**: Building complex UIs from smaller components
- **Domain-Driven Design**: Clear separation of business logic and infrastructure

### Recent Architectural Improvements (v3.0) - ts-belt Monads Integration

#### Complete Functional Programming Migration

- **ts-belt Monads**: Migrated from neverthrow to ts-belt for Either/Maybe patterns
- **Result Pattern**: All server operations use `Observable<Result<T, ApplicationError>>`
- **Option Pattern**: URL parameters processed with `Option<T>` for null safety
- **Functional Composition**: Extensive use of `pipe()` for data transformations
- **Zero Try-Catch**: Eliminated all try-catch constructions in favor of monadic error handling

#### Enhanced Monads System

```typescript
// Either(Result) for server data
service.getTracks(params).pipe(
  map(result =>
    Result.match(
      result,
      tracks => handleSuccess(tracks),
      error => handleError(error)
    )
  )
);

// Maybe(Option) for URL parameters
const searchQuery = pipe(
  Option.fromQueryParam(queryParams.search),
  Option.map(text => text.trim()),
  Option.filter(text => text.length >= 2)
);
```

#### Robust Error Handling System

- **ApplicationError**: Type-safe error system with Zod integration
- **Centralized Error Processing**: ErrorHandlingService with monadic patterns
- **Rich Error Context**: Errors enriched with component, action, and timing information
- **Smart Retry Logic**: Functional retry patterns with exponential backoff
- **User-Friendly Messages**: Automatic translation using Result.match() patterns

#### URL Parameter Management

- **QueryParamsService**: Complete Option monad integration for URL handling
- **TrackSearchWithUrlComponent**: Demonstration of Option patterns with URL sync
- **Type-Safe Filtering**: All URL parameters processed through Option monads
- **Functional Validation**: URL validation using Option.filter() and Option.map()

### Monads Architecture Overview

```typescript
// Core monads facade
export const Result = {
  Ok: value => Belt.R.Ok(value),
  Error: error => Belt.R.Error(error),
  match: Belt.R.match,
  map: Belt.R.map,
  flatMap: Belt.R.flatMap,
};

export const Option = {
  Some: Belt.O.Some,
  None: Belt.O.None,
  fromNullable: Belt.O.fromNullable,
  match: Belt.O.match,
  map: Belt.O.map,
  filter: Belt.O.filter,
};

// Domain-specific utilities
export const QueryFilters = {
  extractSearchQuery: params => Option.fromQueryParam(params.search),
  extractPageNumber: params => Option.fromQueryParamNumber(params.page),
};
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd music-tracks-app
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser and navigate to http://localhost:4200/

### Building for Production

Build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── entities/           # Core business objects with Result monads
│   │   ├── track/          # Track entity and components
│   │   └── genre/          # Genre entity
│   ├── features/           # Feature modules with functional patterns
│   │   ├── track-create/   # Track creation with Result handling
│   │   ├── track-edit/     # Track editing with monadic validation
│   │   ├── track-search/   # Search with Option URL parameters
│   │   └── ...
│   ├── pages/              # Application pages/routes
│   ├── processes/          # Business processes with Result patterns
│   │   └── audio-playback/ # Audio playback with functional error handling
│   ├── shared/             # Shared utilities
│   │   ├── api/            # API services with Result monads
│   │   ├── lib/            # Utility libraries including monads.ts
│   │   │   ├── monads.ts   # ts-belt facade with Either/Maybe patterns
│   │   │   └── application-error.ts # Type-safe error system
│   │   ├── services/       # Shared services with functional patterns
│   │   │   ├── error-handling.service.ts # Monadic error processing
│   │   │   └── query-params.service.ts   # Option-based URL handling
│   │   └── ui/             # Shared UI components
│   └── widgets/            # Complex reusable components with Result handling
├── assets/                 # Static files
├── environments/           # Environment configurations
└── styles/                 # Global styles
```

## Functional Programming with ts-belt

### Either(Result) Pattern for Server Data

All server operations return `Observable<Result<T, ApplicationError>>`:

```typescript
// Service layer
public getTracks(params: TrackFilters): Observable<Result<PaginatedTracksResponse, TrackError>> {
  return this.trackApi.getAll(params).pipe(
    map(apiResult => Result.match(
      apiResult,
      (response) => {
        this.updateCache(response.data);
        return Result.Ok(response);
      },
      (error) => Result.Error(TrackErrors.fetchError('Failed to fetch tracks'))
    ))
  );
}

// Component layer
this.trackService.getTracks(filters).subscribe(result => {
  Result.match(
    result,
    (tracks) => {
      this.tracks = tracks.data;
      this.loading = false;
    },
    (error) => {
      this.errorMessage = error.message;
      this.loading = false;
    }
  );
});
```

### Maybe(Option) Pattern for URL Parameters

All URL parameter processing uses `Option<T>` monads:

```typescript
// URL parameter extraction
public getTrackFilters(): Observable<TrackFilters> {
  return this.route.queryParams.pipe(
    map(queryParams => ({
      search: Option.fromQueryParam(queryParams.search),
      genre: Option.fromQueryParam(queryParams.genre),
      page: Option.fromQueryParamNumber(queryParams.page)
    }))
  );
}

// Functional composition
const validSearch = pipe(
  filters.search,
  Option.map(text => text.trim()),
  Option.filter(text => text.length >= 2)
);

const pageNumber = Option.getWithDefault(filters.page, 1);
```

### Functional Composition with pipe()

```typescript
// Complex data transformations
const processedData = pipe(
  rawData,
  Option.fromNullable,
  Option.map(data => data.transform()),
  Option.filter(data => data.isValid()),
  Option.flatMap(data => validateWithSchema(data)),
  Option.getWithDefault(defaultValue)
);

// URL parameter validation
const updateUrlParam = (paramName: string, value: string | null) => {
  const validValue = pipe(
    Option.fromNullable(value),
    Option.map(v => v.trim()),
    Option.filter(v => v.length > 0),
    Option.match(
      validStr => validStr,
      () => null
    )
  );

  this.queryParamsService.updateQueryParams({ [paramName]: validValue });
};
```

## API Integration with Result Monads

The application uses a functional approach for all API operations:

- **TrackService**: All methods return `Observable<Result<T, TrackError>>`
- **GenreService**: Returns `Observable<Result<string[], GenreError>>`
- **AudioPlaybackService**: All operations return `Result<void, DomainError>`

```typescript
// Typical service method signature
public createTrack(data: TrackCreate): Observable<Result<Track, TrackError>> {
  return this.trackApi.createTrack(data).pipe(
    map(apiResult => Result.match(
      apiResult,
      (track) => Result.Ok(track),
      (error) => Result.Error(TrackErrors.createError('Failed to create track'))
    ))
  );
}
```

The API URL can be configured in the environments files.

# Functional API Services with ts-belt Monads

## Overview

This project implements a **purely functional** API service architecture using **ts-belt monads** for comprehensive error handling and type safety. The system eliminates try-catch constructions in favor of **Either(Result)** patterns for server operations and **Maybe(Option)** patterns for nullable data processing.

## Architecture

The system follows functional programming principles with several key layers:

1. **Monads Facade** - ts-belt wrapper providing unified Either/Maybe API
2. **BaseApiService** - Functional HTTP client with Result pattern integration
3. **ValidatedApiService** - Abstract facade with monadic error handling
4. **Concrete API Services** - Domain services using Result patterns
5. **ErrorHandlingService** - Functional error processing with ApplicationError
6. **QueryParamsService** - Option-based URL parameter management
7. **Business Services** - Pure functional domain logic

## Key Features

### ✅ Pure Functional Programming

- **Zero Try-Catch**: All error handling through Result monads
- **Immutable Operations**: All functions return new values without side effects
- **Composable Logic**: Extensive use of pipe() for data transformations
- **Type-Safe Nullability**: Option monads eliminate null/undefined issues

### ✅ ts-belt Monads Integration

- **Either(Result) Pattern**: All server operations return `Result<T, E>`
- **Maybe(Option) Pattern**: URL parameters processed with `Option<T>`
- **Functional Composition**: Rich pipe() operations for data flow
- **Monadic Error Chains**: Seamless error propagation without exceptions

### ✅ URL Parameter Management

- **Option-Based Processing**: All URL params through Option monads
- **Type-Safe Validation**: Filter and transform with Option.filter/map
- **Null Safety**: Complete elimination of null/undefined checks
- **Functional Routing**: Declarative URL parameter handling

### ✅ Comprehensive Error System

- **ApplicationError**: Rich error types with Zod validation integration
- **Domain-Specific Errors**: TrackError, GenreError with type safety
- **Functional Error Handling**: Result.match() patterns throughout
- **User-Friendly Messages**: Automatic error message generation

## Core Components

### Monads Facade (ts-belt wrapper)

```typescript
// Unified Result API
export const Result = {
  Ok: value => Belt.R.Ok(value),
  Error: error => Belt.R.Error(error),
  match: Belt.R.match,
  map: Belt.R.map,
  flatMap: Belt.R.flatMap,
  isOk: Belt.R.isOk,
  isError: Belt.R.isError,
};

// Unified Option API
export const Option = {
  Some: Belt.O.Some,
  None: Belt.O.None,
  fromNullable: Belt.O.fromNullable,
  match: Belt.O.match,
  map: Belt.O.map,
  filter: Belt.O.filter,
  getWithDefault: Belt.O.getWithDefault,
};

// Domain-specific utilities
export const QueryFilters = {
  extractSearchQuery: params => Option.fromQueryParam(params.search),
  extractPageNumber: params => Option.fromQueryParamNumber(params.page),
  extractGenreFilter: params => Option.fromQueryParam(params.genre),
};
```

### Functional API Services

```typescript
// All methods return Result monads
@Injectable()
export class TrackService {
  public getTracks(params: TrackFilters): Observable<Result<PaginatedTracksResponse, TrackError>> {
    return this.trackApi.getAll(params).pipe(
      map(apiResult =>
        Result.match(
          apiResult,
          response => {
            this.updateCache(response.data);
            return Result.Ok(response);
          },
          error => Result.Error(TrackErrors.fetchError('Failed to fetch tracks'))
        )
      )
    );
  }

  public createTrack(data: TrackCreate): Observable<Result<Track, TrackError>> {
    // Optimistic update logic with functional rollback
    return this.trackApi.createTrack(data).pipe(
      map(apiResult =>
        Result.match(
          apiResult,
          track => {
            this.syncOptimisticUpdate(track);
            return Result.Ok(track);
          },
          error => {
            this.rollbackOptimisticUpdate();
            return Result.Error(TrackErrors.createError('Failed to create track'));
          }
        )
      )
    );
  }
}
```

### URL Parameter Management with Option Monads

```typescript
@Injectable()
export class QueryParamsService {
  public getTrackFilters(): Observable<TrackFilters> {
    return this.route.queryParams.pipe(
      map(queryParams => ({
        search: QueryFilters.extractSearchQuery(queryParams),
        genre: QueryFilters.extractGenreFilter(queryParams),
        page: QueryFilters.extractPageNumber(queryParams),
        limit: QueryFilters.extractPageSize(queryParams),
      }))
    );
  }

  public updateQueryParams(
    updates: Partial<Record<string, string | number | null>>
  ): Promise<boolean> {
    // Functional parameter validation
    const validatedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      const validValue = pipe(
        Option.fromNullable(value),
        Option.map(v => String(v).trim()),
        Option.filter(v => v.length > 0),
        Option.match(
          valid => valid,
          () => null
        )
      );
      return { ...acc, [key]: validValue };
    }, {});

    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: validatedUpdates,
      queryParamsHandling: 'merge',
    });
  }
}
```

### Audio Playback with Result Monads

```typescript
@Injectable()
export class AudioPlaybackService {
  public playTrack(track: Track): Result<void, DomainError> {
    const trackValidation = this.validateTrack(track);

    return Result.match(
      trackValidation,
      validTrack => {
        const urlResult = this.getFullAudioUrl(validTrack.audioFile);

        return Result.match(
          urlResult,
          audioUrl => {
            this.initializeAudio(audioUrl);
            return Result.Ok(undefined);
          },
          error => Result.Error(AudioErrors.urlError('Invalid audio URL'))
        );
      },
      error => Result.Error(error)
    );
  }

  public setVolume(volume: number): Result<void, DomainError> {
    const volumeValidation = this.validateVolume(volume);

    return Result.match(
      volumeValidation,
      validVolume => {
        this.audioElement.volume = validVolume;
        this.updateState({ volume: validVolume });
        return Result.Ok(undefined);
      },
      error => Result.Error(error)
    );
  }
}
```

## Functional Component Patterns

### Result Handling in Components

```typescript
@Component({...})
export class TrackListComponent {
  private loadTracks(): void {
    this.trackService.getTracks(this.filters).subscribe(result => {
      Result.match(
        result,
        (response) => {
          this.tracks = response.data;
          this.pagination = response.meta;
          this.loading = false;
        },
        (error) => {
          this.errorMessage = error.message;
          this.loading = false;
        }
      );
    });
  }

  private deleteTrack(id: string): void {
    this.trackService.deleteTrack(id).subscribe(result => {
      Result.match(
        result,
        () => {
          this.showSuccessMessage('Track deleted successfully');
          this.refreshTrackList();
        },
        (error) => {
          this.showErrorMessage(`Delete failed: ${error.message}`);
        }
      );
    });
  }
}
```

### Option Handling for URL Parameters

```typescript
@Component({...})
export class TrackSearchComponent {
  ngOnInit(): void {
    this.queryParamsService.getTrackFilters().subscribe(filters => {
      // Handle search parameter
      Option.match(
        filters.search,
        (searchText) => {
          this.searchControl.setValue(searchText, { emitEvent: false });
          this.performSearch(searchText);
        },
        () => {
          this.searchControl.setValue('', { emitEvent: false });
        }
      );

      // Handle page parameter with default
      const currentPage = Option.getWithDefault(filters.page, 1);
      this.updatePagination(currentPage);
    });
  }

  private updateSearchQuery(searchText: string): void {
    const validSearch = pipe(
      Option.fromNullable(searchText),
      Option.map(text => text.trim()),
      Option.filter(text => text.length >= 2)
    );

    Option.match(
      validSearch,
      (validText) => {
        this.queryParamsService.updateQueryParams({
          search: validText,
          page: 1 // Reset to first page
        });
      },
      () => {
        this.queryParamsService.updateQueryParams({
          search: null,
          page: 1
        });
      }
    );
  }
}
```

## Migration Benefits

### From Imperative to Functional

**Before (imperative with try-catch):**

```typescript
public async playTrack(track: Track): Promise<void> {
  try {
    if (!track || !track.audioFile) {
      throw new Error('Invalid track');
    }

    const url = this.buildAudioUrl(track.audioFile);
    await this.audioElement.play();
    this.updateState({ isPlaying: true });
  } catch (error) {
    this.handleError(error);
  }
}
```

**After (functional with Result monads):**

```typescript
public playTrack(track: Track): Result<void, DomainError> {
  const trackValidation = this.validateTrack(track);

  return Result.match(
    trackValidation,
    (validTrack) => {
      const urlResult = this.getFullAudioUrl(validTrack.audioFile);

      return Result.match(
        urlResult,
        (audioUrl) => {
          this.initializePlayback(audioUrl);
          return Result.Ok(undefined);
        },
        (error) => Result.Error(error)
      );
    },
    (error) => Result.Error(error)
  );
}
```

### From Null Checks to Option Monads

**Before (imperative null handling):**

```typescript
private getSearchFromUrl(): string {
  const params = this.route.snapshot.queryParams;
  const search = params['search'];

  if (search && typeof search === 'string' && search.trim().length > 0) {
    return search.trim();
  }

  return '';
}
```

**After (functional with Option monads):**

```typescript
private getSearchFromUrl(): Option<string> {
  return this.queryParamsService.getQueryParam('search').pipe(
    map(searchOption => pipe(
      searchOption,
      Option.map(text => text.trim()),
      Option.filter(text => text.length > 0)
    ))
  );
}
```

## Performance & Type Safety

### Compile-Time Safety

- **Result Types**: All error cases explicitly typed and handled
- **Option Types**: Null/undefined cases eliminated at compile time
- **Zod Integration**: Runtime validation with monadic error handling
- **Functional Composition**: Type-safe pipe operations

### Runtime Efficiency

- **No Exception Overhead**: Result monads avoid try-catch performance cost
- **Lazy Evaluation**: Option chains only execute when values exist
- **Immutable Updates**: Efficient state management without mutations
- **Optimistic Updates**: Smooth UX with functional rollback mechanisms

## File Structure

```
src/app/shared/
├── lib/
│   ├── monads.ts                    # ts-belt facade with Either/Maybe
│   ├── application-error.ts         # Functional error system
│   └── validators/
│       └── zod-validators.ts        # Functional validation with Result
├── services/
│   ├── error-handling.service.ts    # Monadic error processing
│   └── query-params.service.ts      # Option-based URL management
└── api/
    ├── base-api.service.ts          # Result-based HTTP client
    ├── validated-api.service.ts     # Functional API facade
    ├── validated-track-api.service.ts # Track API with Result monads
    └── validated-genre-api.service.ts # Genre API with Result monads
```

## Change Log

### v3.0.0 - Complete Functional Programming Migration

- **ts-belt Integration**: Complete migration from neverthrow to ts-belt monads
- **Functional Architecture**: Eliminated all try-catch constructions
- **Option URL Handling**: URL parameters processed through Option monads
- **Result Server Operations**: All API calls return Result monads
- **Functional Composition**: Extensive pipe() usage for data transformations
- **Type-Safe Error Handling**: ApplicationError system with monadic patterns
- **Query Parameter Service**: Complete Option-based URL management
- **Audio Playback Service**: Functional refactor with Result patterns

See [MIGRATION-3.md](./MIGRATION-3.md) for detailed migration guide.

### v2.0.0 - Enhanced Error Handling & Validation

- **AudioPlaybackService**: Complete refactoring with Result pattern and comprehensive validation
- **ErrorHandlingService**: Centralized error processing with rich context and smart retry logic
- **Schema Validation**: Enhanced Zod schemas with flexible validation for backward compatibility

See [MIGRATION-2.md](./MIGRATION-2.md) for detailed migration guide.

### v1.0.0 - API Services with Zod Validation

- Complete API service architecture with automatic validation
- Backward compatible migration from legacy services
- Comprehensive error handling with retry logic

---

_This project demonstrates enterprise-grade functional programming patterns with ts-belt monads, providing type-safe, composable, and maintainable code without traditional imperative error handling._
