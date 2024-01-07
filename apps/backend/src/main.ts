import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as swStats from 'swagger-stats';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3333;

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
    console.error('Uncaught Exception:', err);
    // Handle the error gracefully, log it, and take appropriate actions
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Handle the rejection gracefully, log it, and take appropriate actions
  });

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
