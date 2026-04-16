import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ErrorResponse {
  code: string;
  message: string;
  requestId: string;
  status: number;
  path: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string | undefined) || randomUUID();
    response.setHeader('X-Request-Id', requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId,
      status,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const statusMappedCode = this.mapStatusToCode(status);

      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          ...errorResponse,
          code: this.isBusinessCode(exceptionResponse)
            ? exceptionResponse
            : statusMappedCode,
          message: this.isBusinessCode(exceptionResponse)
            ? exceptionResponse
            : exceptionResponse,
          status,
        };
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        const message = Array.isArray(resp.message)
          ? 'PARAM_INVALID'
          : ((resp.message as string) || exception.message);
        const details =
          (resp.details as Record<string, unknown> | undefined) ||
          (Array.isArray(resp.message)
            ? { validationErrors: resp.message }
            : undefined);
        const codeCandidate = (resp.code as string | undefined) || message;
        const code = this.isBusinessCode(codeCandidate)
          ? codeCandidate
          : (Array.isArray(resp.message) ? 'VALIDATION_ERROR' : statusMappedCode);

        errorResponse = {
          ...errorResponse,
          code,
          message,
          requestId,
          details,
          status,
        };
      }
    } else if (exception instanceof Error) {
      errorResponse = {
        ...errorResponse,
        message: exception.message,
      };
      this.logger.error(
        `Internal error: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json(errorResponse);
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'PARAM_INVALID';
      case HttpStatus.UNAUTHORIZED:
        return 'AUTH_UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'AUTH_FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT_VERSION';
      default:
        return 'ERROR';
    }
  }

  private isBusinessCode(value: unknown): value is string {
    return typeof value === 'string' && /^[A-Z0-9_]+$/.test(value);
  }
}
