import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface Response<T> {
  code: string;
  message: string;
  requestId: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    return next.handle().pipe(
      map((data) => ({
        code: 'OK',
        message: 'success',
        requestId,
        data,
      })),
    );
  }
}
