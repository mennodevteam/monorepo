import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Send exception to Sentry for 5xx server errors or unhandled exceptions
    if (status >= 500 || !(exception instanceof HttpException)) {
      Sentry.captureException(exception, {
        extra: {
          url: request.url,
          method: request.method,
          body: request.body,
        },
      });
      this.logger.error(`[${status}] ${request.method} ${request.url} - ${exception?.message || exception}`, exception?.stack);
    }

    response.status(status).json({
      status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception?.message,
    });
  }
}
