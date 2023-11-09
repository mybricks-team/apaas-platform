import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export default class TransformSuccessCodeInterceptor implements NestInterceptor {
  private readonly statusCode: number; // 自定义的状态码

  constructor(statusCode: number) {
    this.statusCode = statusCode;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rawRes = context.switchToHttp().getResponse();
    if(rawRes) {
      rawRes.statusCode = this.statusCode;
    }
    return next.handle().pipe(
      map(data => {
        return data
      }),
    );
  }
}