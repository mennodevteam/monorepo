import './instrument';
import * as Sentry from '@sentry/nestjs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SentryLogger } from './app/core/sentry-logger';
import * as swStats from 'swagger-stats';
import { json } from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(new SentryLogger());
  app.enableCors();
  const port = process.env.PORT || 3333;
  app.use(json({ limit: '20mb' }));

  app.use(
    swStats.getMiddleware({
      // swaggerSpec: document,
      authentication: true,
      onAuthenticate: function (req: any, username: string, password: string) {
        // simple check for username and password
        return username === 'admin' && password === 'sxWW(@ndacdus@@!x983';
      },
    })
  );

  // Process event handlers
  process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
  });

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
  });

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
