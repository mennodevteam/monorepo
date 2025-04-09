import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { apiInterceptorProvider, provideJalaliDatePickerProvider } from './core/providers';
import { paginatorIntlProvider } from './core/providers/mat-paginator-intl.provider';
import { provideTranslation } from './core/providers/translate-module.provider';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
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
    provideRouter(appRoutes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideAnimationsAsync(),
    apiInterceptorProvider(),
    provideJalaliDatePickerProvider(),
    provideTranslation(),
    paginatorIntlProvider(),
    provideCharts(withDefaultRegisterables())
  ],
};
