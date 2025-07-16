# GraphQL Subscriptions Implementation

## Overview

Real-time display of the active track has been implemented using **GraphQL subscriptions**.

## Server-side

### 1. Subscription Resolver

File `test-server-case/src/graphql/resolvers/subscriptions/track.subscriptions.ts`:

- An interval changes the active track every 1–2 seconds.
- A random track is selected from the database.
- Changes are published via **Mercurius PubSub**.

### 2. GraphQL Schema

`test-server-case/src/graphql/typeDefs/subscription.graphql`:

```graphql
type ActiveTrack {
  id: ID!
  title: String!
  artist: String!
  audioFile: String!
}

type Subscription {
  activeTrack: ActiveTrack
}
```

### 3. Server Configuration

`test-server-case/src/index.ts`:

- Subscriptions support enabled in Mercurius.
- Interval that updates the active track started on server boot.

## Client-side

### 1. Apollo Client Configuration

Updated `src/app/shared/config/apollo.config.ts`:

- WebSocket link added via `graphql-ws`.
- Split link routes subscriptions over WS and all other operations over HTTP.

### 2. ActiveTrackService

`src/app/processes/active-track/model/active-track.service.ts`:

- Uses **Angular Signals** for reactive state.
- Subscribes to the `activeTrack` GraphQL subscription.
- Automatically reconnects on errors.

### 3. ActiveTrackWidget

`src/app/widgets/active-track-widget/active-track-widget.component.{ts,html,scss}`:

- Shows the current active track information.
- Live progress bar and playback controls.
- Responsive design.

### 4. GraphQL Subscription Document

`src/app/shared/graphql/subscriptions/track.subscription.graphql`:

```graphql
subscription ActiveTrack {
  activeTrack {
    id
    title
    artist
    audioFile
  }
}
```

## Usage

1. Start the server
   ```bash
   cd test-server-case && npm run dev
   ```
2. Start the client
   ```bash
   cd front-end-school-3-0-povezlo && npm start
   ```
3. Open the application in a browser.
4. The Active Track widget on the home page will display the current track in real time and update every 1-2 seconds.

## Technical Notes

- WebSocket connection automatically reconnects on drop.
- Angular Signals are used for highly performant reactive rendering.
- Audio is played through `AudioPlaybackService`; the first track auto-plays on load, subsequent tracks respect user controls.

## Possible Enhancements

1. Add animation when a new track appears.
2. Display history of recently played tracks.
3. Provide manual controls to change/skip the active track.
4. Further integrate with the audio player for synchronisation across tabs or devices.
