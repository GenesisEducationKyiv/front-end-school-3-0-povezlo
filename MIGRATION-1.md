# Migration Guide: ApiService → BaseApiService

## Overview

This document describes the migration from the old `ApiService` pattern to the new `BaseApiService` with built-in Result type handling.

## What Changed

### Before (ApiService pattern)

```typescript
import { ApiService } from '@shared/lib/http';

@Injectable({
  providedIn: 'root',
})
export class TrackApiService {
  constructor(private api: ApiService) {}

  public getAll(params: TrackListParams): Observable<PaginatedTracksResponse> {
    return this.api
      .get<unknown>('tracks', params)
      .pipe(map(response => PaginatedTracksResponseSchema.parse(response)));
  }

  public create(data: TrackCreate): Observable<Track> {
    return this.api
      .post<unknown>('tracks', data)
      .pipe(map(response => TrackSchema.parse(response)));
  }
}
```

### After (BaseApiService pattern)

```typescript
import { BaseApiService } from './base-api.service';
import { Result } from 'neverthrow';
import { DomainError } from '@app/shared/lib/result';

@Injectable({
  providedIn: 'root',
})
export class TrackApiService extends BaseApiService {
  protected override readonly baseUrl = '/api';

  public getAll(
    params?: TrackListParams
  ): Observable<Result<PaginatedTracksResponse, DomainError>> {
    return this.getList<unknown>('tracks', params as Record<string, string | number>).pipe(
      map(result => result.map(response => PaginatedTracksResponseSchema.parse(response)))
    );
  }

  public createTrack(data: TrackCreate): Observable<Result<Track, DomainError>> {
    return this.create<unknown>('tracks', data).pipe(
      map(result => result.map(response => TrackSchema.parse(response)))
    );
  }
}
```

## Key Changes

### 1. **Inheritance instead of Injection**

- **Before**: Constructor injection of `ApiService`
- **After**: Extend `BaseApiService` class

### 2. **Built-in Result Types**

- **Before**: Direct Observable returns with manual error handling
- **After**: All methods return `Observable<Result<T, DomainError>>`

### 3. **Automatic Error Handling**

- **Before**: Errors bubbled up as Observable errors
- **After**: Errors automatically wrapped in typed `DomainError` through interceptor

### 4. **BaseURL Configuration**

- **Before**: Manually construct URLs or rely on ApiService configuration
- **After**: Set `baseUrl` property in each service

### 5. **Schema Validation Pattern**

- **Before**: Direct mapping of response
- **After**: Use `result.map()` to handle validation within the Result context

## Migration Steps

### Step 1: Update Imports

```typescript
// Remove
import { ApiService } from '@shared/lib/http';

// Add
import { BaseApiService } from './base-api.service';
import { Result } from 'neverthrow';
import { DomainError } from '@app/shared/lib/result';
```

### Step 2: Change Class Declaration

```typescript
// Before
export class TrackApiService {
  constructor(private api: ApiService) {}

// After
export class TrackApiService extends BaseApiService {
  protected override readonly baseUrl = '/api';
```

### Step 3: Update Method Signatures

```typescript
// Before
public getAll(): Observable<Track[]>

// After
public getAll(): Observable<Result<Track[], DomainError>>
```

### Step 4: Update Method Implementations

```typescript
// Before
return this.api.get<unknown>('tracks').pipe(map(response => TracksSchema.parse(response)));

// After
return this.getList<unknown>('tracks').pipe(
  map(result => result.map(response => TracksSchema.parse(response)))
);
```

### Step 5: Rename Conflicting Methods

If your service has methods that conflict with BaseApiService methods (`create`, `update`, `getById`, etc.), rename them:

```typescript
// Before
public create(data: TrackCreate): Observable<Result<Track, DomainError>>

// After
public createTrack(data: TrackCreate): Observable<Result<Track, DomainError>>
```

## Benefits of Migration

### 1. **Consistent Error Handling**

All HTTP errors are automatically typed and handled consistently across the application.

### 2. **Reduced Boilerplate**

Use inherited CRUD methods for standard operations:

- `getList()` for collections
- `getById()` for single items
- `create()` for creating resources
- `update()` / `partialUpdate()` for modifications
- `remove()` for deletions

### 3. **Type Safety**

Full TypeScript support with proper error typing through Result types.

### 4. **Centralized Configuration**

URL building, error handling, and HTTP options managed in one place.

## Updated Services

### TrackApiService

- ✅ Migrated to BaseApiService
- ✅ All methods return Result types
- ✅ Schema validation preserved
- ✅ Added helper methods using inherited functionality

### GenreApiService

- ✅ Migrated to BaseApiService
- ✅ Result types implemented
- ✅ Additional CRUD methods added

## Usage in Components

### Before

```typescript
this.trackService.getAll(params).subscribe({
  next: tracks => {
    this.tracks = tracks;
  },
  error: error => {
    // Manual error handling
    this.handleError(error);
  },
});
```

### After

```typescript
this.trackService.getAll(params).subscribe({
  next: result => {
    result.match(
      tracks => {
        this.tracks = tracks;
      },
      error => {
        // Typed error handling
        switch (error.code) {
          case DomainErrorCode.NETWORK_ERROR:
            this.handleNetworkError(error);
            break;
          case DomainErrorCode.VALIDATION_ERROR:
            this.handleValidationError(error);
            break;
          default:
            this.handleUnknownError(error);
        }
      }
    );
  },
});
```

## Next Steps

1. **Update Components**: Modify components to handle Result types
2. **Error Handling**: Implement consistent error handling patterns
3. **Testing**: Update unit tests to work with Result types
4. **Documentation**: Update API documentation to reflect new patterns

## Best Practices

1. Always use `result.map()` for transforming successful responses
2. Handle errors consistently using the match pattern
3. Use inherited CRUD methods when possible
4. Keep schema validation for data integrity
5. Set appropriate `baseUrl` for each service
