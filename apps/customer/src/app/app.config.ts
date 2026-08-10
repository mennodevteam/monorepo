import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { appRoutes } from './app.routes';
import { apiInterceptorProvider } from './core/providers/api.provider';
import { ThemeService } from './core/services/theme.service';
import { provideSsrDataTransfer } from './core/providers/ssr-data.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideClientHydration(),
    provideAnimations(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
    ),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
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
    provideSsrDataTransfer(),
    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      return themeService.init();
    }),
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};

