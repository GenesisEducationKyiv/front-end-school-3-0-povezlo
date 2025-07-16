# Automatic Active Track Playback

## Feature Overview

The application now supports real-time automatic playback of the **active track** using GraphQL subscriptions.

## How It Works

### Server-side

1. **Track filtering** – only tracks that have an uploaded audio file are considered.
2. **Random selection** – every 1–2 seconds a random track from the filtered list is chosen.
3. **GraphQL subscription** – the change is broadcast via the `activeTrack` WebSocket subscription.

### Client-side

1. **Live subscription** – `ActiveTrackService` listens to `activeTrack` updates.
2. **Auto-play** – when a new track is received the audio starts automatically (first track on app load starts immediately, subsequent tracks are queued).
3. **First track** – on application start the first received active track begins playback without user interaction.

## Key Components

### ActiveTrackService

- Manages the `activeTrack` subscription.
- Integrates with `AudioPlaybackService` to start/stop audio.
- Auto-plays the first track after the initial subscription payload.

### ActiveTrackWidget

- Displays information about the current active track.
- Shows playback state (playing / paused).
- Provides basic playback controls.
- Visualises progress and playback time.

### AudioPlaybackService

- Handles all low-level audio playback.
- Maintains the player state.
- Validates tracks before starting playback.

## Details & Behaviour

### Track Filtering

- Only tracks with an associated audio file are emitted.
- Tracks without audio are ignored by the subscription publisher.

### Automatic Playback

- The **first** track after application load starts automatically.
- Further tracks are loaded but playback can be user-controlled via the widget.

### Error Handling

- Automatic reconnection on WebSocket disconnect.
- Graceful handling of playback errors.
- Error state is reflected in the UI.

## Quick Start

1. Run the server: `npm start` inside `test-server-case`.
2. Run the client: `npm start` inside `front-end-school-3-0-povezlo`.
3. Open the app in your browser.
4. The Active Track widget appears on the main page.
5. The first track starts playing automatically.

## Technical Notes

### GraphQL Subscription

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

### WebSocket Connection

- Powered by `graphql-ws`.
- Automatic reconnection logic.
- Error handling on transport level.

### Angular Signals Integration

- Reactive state management via Angular Signals.
- UI updates automatically on state change.
- Optimised for performance with fine-grained reactivity.
