import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { appRoutes } from './app.routes';
import { apiInterceptorProvider } from './core/providers/api.provider';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
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
    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      return themeService.init();
    }),
  ],
};
