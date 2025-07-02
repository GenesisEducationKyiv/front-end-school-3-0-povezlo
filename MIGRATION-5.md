# MIGRATION-5.md - GraphQL Server and API Adapter

## Overview

As part of the GraphQL migration, support for a new API server has been integrated, providing both REST and GraphQL interfaces for working with application data. The project includes an adapter that allows seamless switching between the two API types.

## GraphQL Server Reference

**Repository:** [https://github.com/povezlo/test-server-case](https://github.com/povezlo/test-server-case)

**Local Location:** `C:\Users\alist\Desktop\test-server-case`

## Server Functionality

### 1. GraphQL API

The server provides a full-featured GraphQL API with the following capabilities:

#### Data Schema:

- **Tracks** - main entity for managing music tracks
- **Genres** - music genre categories
- **File Upload** - audio file uploads

#### Queries:

```graphql
# Get list of tracks with filtering and pagination
tracks(input: TracksInput): [Track!]!

# Get specific track by ID
track(id: ID!): Track

# Get list of all genres
genres: [Genre!]!
```

#### Mutations:

```graphql
# Create new track
createTrack(input: TrackCreateInput!): Track!

# Update existing track
updateTrack(id: ID!, input: TrackUpdateInput!): Track!

# Delete track
deleteTrack(id: ID!): Boolean!

# Bulk delete tracks
deleteTracks(ids: [ID!]!): BulkDeleteTracksResult!

# Upload audio file for track
uploadTrackFile(id: ID!, file: Upload!): Track!

# Delete audio file
deleteTrackFile(id: ID!): Track!
```

### 2. REST API

In parallel with GraphQL, the server supports classic REST API for backward compatibility:

- `GET /api/tracks` - get list of tracks
- `POST /api/tracks` - create track
- `PUT /api/tracks/:id` - update track
- `DELETE /api/tracks/:id` - delete track
- `GET /api/genres` - get genres

### 3. File Upload Support

The server supports file uploads through:

- **GraphQL:** using `multipart/form-data` specification with `graphql-upload-minimal` library
- **REST:** standard multipart uploads

## Client Integration

### GraphQL Service

A specialized `TrackGraphQLService` has been created for working with the GraphQL API:

```typescript
@Injectable({
  providedIn: 'root',
})
export class TrackGraphQLService {
  // Methods for working with tracks via GraphQL
  getTracks(input?: TracksInput): Observable<GetTracksQuery['tracks']>;
  createTrack(input: TrackCreateInput): Observable<CreateTrackMutation['createTrack']>;
  updateTrack(id: string, input: TrackUpdateInput): Observable<UpdateTrackMutation['updateTrack']>;
  deleteTrack(id: string): Observable<boolean>;
  deleteTracks(ids: string[]): Observable<BulkDeleteTracksMutation['deleteTracks']>;
  uploadFile(id: string, file: File): Observable<Track>;
  deleteFile(id: string): Observable<Track>;
}
```

### Apollo Client Configuration

Apollo Client is configured with file upload support:

```typescript
export function createApollo(): ApolloClientOptions<unknown> {
  const uploadLink = createUploadLink({ uri: environment.graphqlUrl }) as unknown as ApolloLink;

  return {
    link: uploadLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
      query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
  };
}
```

## Server Setup and Testing

### 1. Install Dependencies

```bash
cd C:\Users\alist\Desktop\test-server-case
npm install
```

### 2. Start Server

```bash
npm run dev
```

The server will be available at `http://localhost:8000`

### 3. Available Endpoints

- **GraphQL Playground:** `http://localhost:8000/graphql`
- **REST API Documentation:** `http://localhost:8000/documentation`
- **Health Check:** `http://localhost:8000/health`

### 4. GraphQL Query Examples

Examples are available in the repository in the `graphql-examples/` folder:

- `01-get-genres.graphql`
- `02-get-tracks.graphql`
- `03-create-track.graphql`
- `04-update-track.graphql`
- `05-get-track-by-id.graphql`
- `06-delete-operations.graphql`

## Technical Features

### 1. API Adapter

The project contains an adapter architecture that allows:

- Transparent switching between REST and GraphQL
- Unified interface for working with data
- Gradual migration from REST to GraphQL

### 2. Type Safety

- Full typing of GraphQL schema through CodeGen
- TypeScript types for all operations
- Automatic type generation from schema

### 3. Caching Strategy

- Configured Apollo Client caching strategy
- `cache-and-network` for watch queries
- `network-only` for single queries

### 4. Error Handling

- Centralized error handling
- Support for partial errors in GraphQL
- Detailed validation error information

## GraphQL Integration Benefits

1. **Query Efficiency** - fetching only necessary data
2. **Type Safety** - full TypeScript-level typing
3. **Single Entry Point** - one endpoint for all operations
4. **Self-Documenting** - built-in schema documentation
5. **Filtering Flexibility** - complex queries without API changes
6. **Real-time Capabilities** - ready for subscriptions addition

## Next Steps

1. Gradual migration of all components to GraphQL
2. Adding subscriptions for real-time updates
3. Optimizing caching and query batching
4. Integration with authentication system
5. Adding GraphQL operation metrics and monitoring

## Links

- [GraphQL Server Repository](https://github.com/povezlo/test-server-case)
- [Apollo Angular Documentation](https://apollo-angular.com/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
