import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { appRoutes } from './app.routes';
import { apiInterceptorProvider } from './core/providers/api.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withInterceptorsFromDi()),
    provideTanStackQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
    ),
    apiInterceptorProvider(),
  ],
};
