/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './app/core/sentry.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3333;
  await app.listen(port);

  Sentry.init({
    dsn: process.env.SENTRY_DNS,
  });
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));
  Sentry.captureMessage('api started');

  // Process event handlers
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Handle the error gracefully, log it, and take appropriate actions
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Handle the rejection gracefully, log it, and take appropriate actions
  });

  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
