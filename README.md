Music Tracks App
A modern Angular application for managing music tracks with a clean, responsive UI built with Angular Material.
Overview
Music Tracks App is a comprehensive solution for managing music tracks. This single-page application allows users to create, edit, delete, and search tracks in a library. It features audio playback with visualization, bulk operations, and responsive design.
Features
Track Management

Create tracks with title, artist, album, and genre information
Edit existing tracks to update metadata
Delete tracks individually or in bulk
Upload audio files (MP3, WAV, OGG) for tracks
Optimistic UI updates for smooth user experience

Music Player

Play/pause audio tracks
Audio visualization with waveform display
Volume control with mute toggle
Progress tracking with timeline seeking
Persistent volume settings between sessions

Search & Filtering

Search by title, artist, or album
Filter by genre or artist
Sort by various fields (title, artist, album, date added)
Pagination for large track collections

UI Features

Responsive design works on both desktop and mobile
Material Design components
Dark UI theme
Loading indicators for asynchronous operations
Toast notifications for operation feedback

Technical Overview
Architecture
The project follows a clean, modular architecture based on feature-first organization:

Entities: Core business objects (Track, Genre)
Features: Specific user-facing functionality (track creation, editing, etc.)
Pages: Application routes and layout containers
Widgets: Reusable composite components
Shared: Common utilities, services, and UI components
Processes: Application-wide business processes (audio playback)

Tech Stack

Angular 18: Latest version with standalone components
RxJS: Reactive programming for async operations
Angular Material: UI component library
WaveSurfer.js: Audio visualization
TypeScript: Static typing and modern JavaScript features

Key Design Patterns

Optimistic Updates: UI updates immediately while backend catches up
Reactive State Management: Observable-based state handling
Dependency Injection: Service composition
Component Composition: Building complex UIs from smaller components

Getting Started
Prerequisites

Node.js (v18 or later)
npm (v9 or later)

Installation

cd music-tracks-app

Install dependencies:
 npm install

Start the development server:
 npm start

Open your browser and navigate to http://localhost:4200/

Building for Production
Build the application for production:
bashnpm run build
The build artifacts will be stored in the dist/ directory.
Project Structure
src/
├── app/
│   ├── entities/          # Core business objects
│   │   ├── track/         # Track entity and components
│   │   └── genre/         # Genre entity
│   ├── features/          # Feature modules
│   │   ├── track-create/  # Track creation feature
│   │   ├── track-edit/    # Track editing feature
│   │   └── ...
│   ├── pages/             # Application pages/routes
│   ├── processes/         # Business processes
│   │   └── audio-playback/# Audio playback handling
│   ├── shared/            # Shared utilities
│   │   ├── api/           # API services
│   │   ├── config/        # Configuration services
│   │   ├── lib/           # Utility libraries
│   │   └── ui/            # Shared UI components
│   └── widgets/           # Complex reusable components
├── assets/                # Static files
├── environments/          # Environment configurations
└── styles/                # Global styles
API Integration
The application is designed to work with a RESTful API. The API endpoints are managed through the shared API services:

TrackApiService: Handles CRUD operations for tracks
GenreApiService: Manages genre-related operations

The API URL can be configured in the environments files.

P.S. Haven't had time to test the project. I wanted to refactor the structure, but I didn't have time because of my main work. I'm sorry if something's wrong))
