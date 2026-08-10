import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryLogger extends ConsoleLogger {
  override error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    if (message instanceof Error) {
      Sentry.captureException(message, { extra: { context } });
    } else if (typeof message === 'string') {
      Sentry.captureException(new Error(message), { extra: { stack, context } });
    } else {
      Sentry.captureException(new Error(JSON.stringify(message)), { extra: { stack, context } });
    }
  }

  override warn(message: any, context?: string) {
    super.warn(message, context);
    Sentry.addBreadcrumb({
      category: context || 'application',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      level: 'warning',
    });
  }

  override log(message: any, context?: string) {
    super.log(message, context);
    Sentry.addBreadcrumb({
      category: context || 'application',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      level: 'info',
    });
  }
}
