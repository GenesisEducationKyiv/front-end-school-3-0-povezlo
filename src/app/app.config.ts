import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { APOLLO_PROVIDERS } from './shared/config/apollo.config';

import { routes } from './app.routes';
import { ErrorHandlingInterceptor } from './shared/interceptors';
import { queryClientInstance } from './shared/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    provideTanStackQuery(queryClientInstance),
    ...APOLLO_PROVIDERS,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlingInterceptor,
      multi: true,
    },
  ],
};
