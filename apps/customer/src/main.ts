import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const dsn =
  (typeof window !== 'undefined' && (window as any).__SENTRY_DSN__) ||
  (typeof process !== 'undefined' ? process.env['SENTRY_CUSTOMER_DSN'] || process.env['SENTRY_DSN'] : undefined);

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  Sentry.captureException(err);
});
