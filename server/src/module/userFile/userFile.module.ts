import {
  MiddlewareConsumer,
  CacheModule,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import UserFileController from './userFile.controller';
import UserFileService from './userFile.service';

@Module({
  controllers: [UserFileController],
  providers: [UserFileService],
})
export default class UserFileModule {}
