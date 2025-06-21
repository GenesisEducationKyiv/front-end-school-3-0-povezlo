// Zone.js import should be first
import 'zone.js';
import 'zone.js/testing';

import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';


// Global settings for tests
declare global {
  interface Window {
    ngZone: unknown;
  }

  const Zone: {
    current: {
      get(name: string): { resetDelegate(): void } | null;
    };
  } | undefined;
}

// Zone.js setup for Vitest
beforeEach(() => {
  // Clear zone before each test
  if (typeof Zone !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const proxyZone = Zone.current.get('ProxyZoneSpec');
    if (proxyZone !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      proxyZone.resetDelegate();
    }
  }
});

afterEach(() => {
  // Clear TestBed after each test
  TestBed.resetTestingModule();

  // Clear DOM
  document.body.innerHTML = '';

  // Force clear zone
  if (typeof Zone !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const proxyZone = Zone.current.get('ProxyZoneSpec');
    if (proxyZone !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      proxyZone.resetDelegate();
    }
  }
});

// Angular TestBed initialization
let testEnvironmentInitialized = false;

export function initializeTestEnvironment(): void {
  if (!testEnvironmentInitialized) {
    try {
      getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting(),
      );

      testEnvironmentInitialized = true;
    } catch (error) {
      console.warn('Test environment already initialized:', error);
      testEnvironmentInitialized = true;
    }
  }
}

// Automatic initialization
initializeTestEnvironment();
