import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { QueryClient, provideAngularQuery } from '@tanstack/angular-query-experimental';
import { apiInterceptorProvider, provideJalaliDatePickerProvider } from './core/providers';
import { paginatorIntlProvider } from './core/providers/mat-paginator-intl.provider';
import { provideTranslation } from './core/providers/translate-module.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
    ),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    apiInterceptorProvider(),
    provideJalaliDatePickerProvider(),
    provideTranslation(),
    paginatorIntlProvider(),
  ],
};
