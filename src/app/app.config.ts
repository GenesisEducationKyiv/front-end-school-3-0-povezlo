import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { APOLLO_PROVIDERS } from './shared/config/apollo.config';

import { routes } from './app.routes';
import { ErrorHandlingInterceptor } from './shared/interceptors';
import { queryClientInstance } from './shared/config';

// Custom image loader для оптимизации изображений
export function customImageLoader(config: ImageLoaderConfig): string {
  // Для локальных изображений просто возвращаем src
  if (config.src.startsWith('/') || config.src.startsWith('./')) {
    return config.src;
  }
  
  // Для внешних изображений можно добавить параметры оптимизации
  const url = new URL(config.src);
  
  // Добавляем параметры размера если они указаны
  if (config.width) {
    url.searchParams.set('w', config.width.toString());
  }
  
  return url.href;
}

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
    {
      provide: IMAGE_LOADER,
      useValue: customImageLoader,
    },
  ],
};
