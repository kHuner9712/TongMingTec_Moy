import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.headers['x-request-id'] as string || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse.message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        errorResponse = {
          code: (resp.code as string) || 'ERROR',
          message: (resp.message as string) || exception.message,
          requestId,
          details: resp.details as Record<string, unknown>,
        };
      }
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;
      this.logger.error(
        `Internal error: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json(errorResponse);
  }
}
