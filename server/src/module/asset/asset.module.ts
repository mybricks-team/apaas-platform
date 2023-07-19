import { Module } from '@nestjs/common';
import AssetService from './asset.service';
import AssetController from './asset.controller';
import UploadService from '../upload/upload.service';
import FlowService from '../flow/flow.service';

@Module({
  controllers: [AssetController],
  providers: [AssetService, UploadService, FlowService],
  exports: [AssetService],
})
export default class AssetModule {}
