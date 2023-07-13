import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export default class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype) {
      return value;
    }
    let errors;
    try {
      const object = plainToClass(metatype, value);
      errors = await validate(object);
    } catch(e) {
      // 兼容 validate 导致的上下文路径丢失，例如：/node_modules/src/validation/ValidationExecutor.ts:62:14
      console.log('[Validation Error]:' + e.message)
    }
    if (errors?.length > 0) {
      throw new BadRequestException(Object.values(errors?.[0]?.constraints)?.[0] || '参数格式有误');
    }
    return value;
  }
}