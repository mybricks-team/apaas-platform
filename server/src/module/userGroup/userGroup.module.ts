
import { Module } from '@nestjs/common';
import UserGroupService from './userGroup.service';
import UserGroupController from './userGroup.controller';

@Module({
  controllers: [UserGroupController],
  providers: [UserGroupService]
})
export default class ShareModule {}
