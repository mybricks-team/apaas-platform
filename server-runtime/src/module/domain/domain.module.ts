import { Module } from '@nestjs/common';
import DomainService from './domain.service';
import DomainController from './domain.controller';
import UploadService from '../upload/upload.service';
import SessionService from '../session/session.service';

@Module({
  controllers: [DomainController],
  providers: [DomainService, UploadService, SessionService],
  exports: [DomainService],
})
export default class DomainModule {}
