import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, of } from 'rxjs';
import { catchError } from 'rxjs/operators'

@Injectable()
export default class ErrHandlerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {}),
      catchError((err) => {
        return of({
          code: -1,
          message: err?.message,
          stack: err?.stack
        })
      })
    );
  }
}