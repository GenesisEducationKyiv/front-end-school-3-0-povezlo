# Testing for Music Tracks App Project

This project is covered by three types of tests: Unit, Component and E2E tests.

## Test Structure

```
tests/
├── unit/                      # Unit tests (Vitest)
│   ├── simple-blackbox.test.ts
│   ├── whitebox-mock.test.ts
│   └── simple-whitebox.test.ts
├── components/                # Component tests (Jest)
│   └── track-card.component.spec.ts
└── e2e/                      # E2E tests (Playwright)
    └── tracks-page.e2e.test.ts
```

## Unit Tests

### 1. Blackbox Testing (`track.service.blackbox.test.ts`)

- **Description**: Tests TrackService functionality without knowledge of internal implementation
- **Coverage**:
  - Service creation
  - Getting list of tracks with filtering
  - Getting track by slug
  - Working with track cache
- **Approach**: Testing through public methods with expected results

### 2. Whitebox Testing (`track.service.whitebox.test.ts`)

- **Description**: Tests internal logic of TrackService using mocks
- **Coverage**:
  - Cache update when loading data
  - Filtering undefined parameters
  - Optimistic updates when creating tracks
  - Rollback changes on API errors
  - Network error handling
  - Slug generation when creating tracks
- **Approach**: Using `vi.fn()` mocks to verify interactions and internal logic

## Component Tests

### 1. Component Testing (`track-card.component.spec.ts`)

- **Description**: Testing Angular components using Jest and Angular TestBed
- **Coverage**:
  - Component creation and initialization
  - Data rendering in DOM
  - User event handling (clicks, emit)
  - Service integration through mocks
  - Track cover display
  - Empty value handling
- **Approach**: Angular TestBed with Jest mocks for deep component testing

## E2E Tests

### Full-featured Testing (`tracks-page.e2e.test.ts`)

- **Description**: End-to-End testing of the entire application in browser
- **Coverage**:
  - Page loading and element display
  - Track list
  - Search and filtering
  - Modal dialogs
  - Track playback
  - Sorting
  - Responsive design
  - Loading states
- **Approach**: Playwright in real browser

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run in watch mode
npm run test:unit:watch
```

### Component Tests

```bash
# Run all component tests
npm run test:components

# Run in watch mode
npm run test:components:watch

# Run with coverage
npm run test:components:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI interface
npm run test:e2e:ui
```

### All Tests

```bash
npm run test:all
```

## Technologies

- **Unit Tests**: Vitest + JSDOM
- **Component Tests**: Jest + Angular TestBed
- **E2E Tests**: Playwright
- **Mocks**:
  - Unit tests: Vitest (`vi.fn()`)
  - Component tests: Jest (`jest.fn()`)
- **DOM Testing**: JSDOM (Vitest), Angular TestBed (Jest)

## Coverage

Project covers:

- ✅ **3 Unit tests**: blackbox and whitebox with mocks (Vitest)
- ✅ **1 Component test**: TrackCardComponent testing (Jest)
- ✅ **1 E2E test**: full-featured testing (Playwright)

### Notes

1. **Framework Choice**: Jest is used for component tests due to better Angular TestBed support, while Vitest is used for unit tests due to high execution speed.

2. **Test IDs**: E2E tests use `data-testid` attributes for reliable element searching.

3. **Async Testing**: All asynchronous operations are properly handled using `done()` callbacks or `async/await`.

## Configuration

- `vitest.unit.config.ts` - configuration for Unit tests
- `jest.config.js` - configuration for component tests
- `playwright.config.ts` - configuration for E2E tests
- `src/test-setup.ts` - test environment setup for Vitest
- `src/setup-jest.ts` - test environment setup for Jest
