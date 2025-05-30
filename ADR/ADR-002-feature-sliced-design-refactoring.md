# ADR-002: Refactor Project Structure to Follow Feature-Sliced Design

## Context

The current project structure partially follows Feature-Sliced Design (FSD) principles but has several inconsistencies and violations that affect maintainability and scalability:

Current issues:

- Business logic mixed in UI components (e.g., `TrackListWidgetComponent` contains filtering, sorting, and pagination logic)
- Widgets layer contains feature-level logic instead of being purely compositional
- Missing proper layered architecture boundaries
- No clear separation between business logic and UI concerns
- Entities contain service logic that should be in features
- Shared layer is too generic without proper segmentation

These violations lead to:

- Difficulty in understanding code ownership and responsibilities
- Complex components that are hard to test and maintain
- Unclear dependencies between modules
- Reduced reusability of components
- Harder to scale the application

## Decision

We will refactor the project structure to properly follow Feature-Sliced Design methodology with strict layer separation.

### 1. Restructure layers according to FSD:

```
src/
├── app/
│   ├── app/           # Application layer (only initialization)
│   ├── processes/     # Business processes (cross-feature flows)
│   ├── pages/         # Page compositions
│   ├── widgets/       # Complex reusable UI blocks (no business logic)
│   ├── features/      # User scenarios (contains business logic)
│   ├── entities/      # Business entities (only models and simple operations)
│   └── shared/        # Reusable utilities (ui-kit, lib, api, config)
```

### 2. Extract business logic from widgets:

Move filtering, sorting, and search logic from `TrackListWidgetComponent` to respective features:

```typescript
// Before: widgets/track-list-widget/track-list-widget.component.ts
// Contains business logic for filtering, sorting, pagination

// After: Multiple feature modules
// features/track-filter/model/track-filter.service.ts
// features/track-sort/model/track-sort.service.ts
// features/track-pagination/model/track-pagination.service.ts
```

### 3. Refactor entities layer:

Keep only pure data models and basic CRUD operations:

```typescript
// entities/track/model/track.model.ts - only interfaces
// entities/track/api/track.api.ts - only API calls
// Move TrackService business logic to features/track-management
```

### 4. Create proper shared segments:

```
shared/
├── ui/            # UI components and directives
├── lib/           # Utilities and helpers
├── api/           # Base API service and interceptors
├── config/        # Configuration constants
└── types/         # Shared TypeScript types
```

### 5. Implementation timeline:

- **Week 1**: Create new structure and move shared components
- **Week 2**: Extract business logic from widgets to features
- **Week 3**: Refactor entities and establish proper boundaries
- **Week 4**: Update imports and ensure no circular dependencies

## Rationale

Proper FSD implementation provides:

- Clear separation of concerns and responsibilities
- Better code organization and discoverability
- Easier testing of isolated business logic
- Improved reusability of components
- Scalable architecture for future growth
- Consistent mental model for all developers
- Prevention of circular dependencies through unidirectional flow

## Status

**Proposed**

## Consequences

**Positive:**

- Cleaner, more maintainable codebase
- Easier to understand component responsibilities
- Better testability of business logic
- Reduced coupling between modules
- Improved developer experience with clear structure
- Easier onboarding for developers familiar with FSD
- Prevents "big ball of mud" architecture anti-pattern

**Negative:**

- Significant refactoring effort (3-4 weeks)
- Temporary disruption to feature development
- Need to update all import paths
- Risk of introducing bugs during refactoring
- Learning curve for team members unfamiliar with FSD
- More files and folders to navigate
- Stricter rules may feel constraining initially

## References

- [Feature-Sliced Design Official Documentation](https://feature-sliced.design/)
- [FSD Architecture Examples](https://github.com/feature-sliced/examples)
- [Architectural Boundary Rules in FSD](https://feature-sliced.design/docs/reference/isolation)
