import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

Sentry.init({
  dsn: process.env['SENTRY_CUSTOMER_DSN'] || process.env['SENTRY_DSN'],
  sendDefaultPii: true,
});

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  Sentry.captureException(err);
});
