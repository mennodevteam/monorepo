import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { appRoutes } from './app.routes';
import { apiInterceptorProvider } from './core/providers/api.provider';
import { ThemeService } from './core/services/theme.service';

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
    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      return themeService.init();
    }),
  ],
};
