import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    if (error) {
      Sentry.captureException(error, { extra: { message, ...meta } });
    } else {
      Sentry.captureException(new Error(message), { extra: meta });
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      category: 'application',
      message: meta ? `${message} ${JSON.stringify(meta)}` : message,
      level: 'warning',
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      category: 'application',
      message: meta ? `${message} ${JSON.stringify(meta)}` : message,
      level: 'info',
    });
  }
}
