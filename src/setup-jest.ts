import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Zone.js initialization for tests
setupZoneTestEnv();

// Additional settings for Angular + Jest
import { ngMocks } from 'ng-mocks';

// ng-mocks setup for better Angular integration
ngMocks.autoSpy('jest');

// Suppress Material Design warnings
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => {
      return '';
    }
  })
});

// Mock for ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock for IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Console setup for tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Suppress known Angular Material warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Could not find Angular Material core theme') ||
     args[0].includes('Material theme'))
  ) {
    return;
  }
  originalError(...(args as Parameters<typeof console.error>));
};

// Zone.js setup for Jest
declare const Zone: {
  __load_patch: (name: string, fn: (global: typeof globalThis) => void) => void;
} | undefined;

if (typeof Zone !== 'undefined') {
  // Patch for better Jest compatibility
  Zone.__load_patch('jest', (global: typeof globalThis) => {
    (global as typeof globalThis & { Zone: typeof Zone }).Zone = Zone;
  });
}
