import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const dsn =
  (typeof window !== 'undefined' && (window as any).__SENTRY_DSN__) ||
  (typeof process !== 'undefined' && (process.env['SENTRY_CUSTOMER_DSN'] || process.env['SENTRY_DSN'])) ||
  environment.sentryDsn;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  Sentry.captureException(err);
});
