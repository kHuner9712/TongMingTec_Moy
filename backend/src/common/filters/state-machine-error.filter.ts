import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StateMachineError } from '../statemachine/state-machine';
import { randomUUID } from 'crypto';

@Catch(StateMachineError)
export class StateMachineErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(StateMachineErrorFilter.name);

  catch(exception: StateMachineError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string | undefined) || randomUUID();
    response.setHeader('X-Request-Id', requestId);

    this.logger.warn(
      `状态流转非法: ${exception.machineName} [${exception.from}] -> [${exception.to}]`,
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      code: 'STATUS_TRANSITION_INVALID',
      message: 'STATUS_TRANSITION_INVALID',
      requestId,
      status: HttpStatus.BAD_REQUEST,
      path: request.url,
      timestamp: new Date().toISOString(),
      details: {
        reason: exception.message,
        machineName: exception.machineName,
        from: exception.from,
        to: exception.to,
      },
    });
  }
}
