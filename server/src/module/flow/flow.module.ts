import { Module } from '@nestjs/common';
import UploadService from '../upload/upload.service';
import FlowController from './flow.controller';

@Module({
  controllers: [FlowController],
  providers: [UploadService]
})
export default class FlowModule {}
