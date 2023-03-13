import { Module } from '@nestjs/common';
import DomainService from './domain.service';
import DomainController from './domain.controller';
import UploadService from '../upload/upload.service';

@Module({
  controllers: [DomainController],
  providers: [DomainService, UploadService],
  exports: [DomainService],
})
export default class DomainModule {}
