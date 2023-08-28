
import { Module } from '@nestjs/common';
import UniService from './universal.service';
import WeappController from './weapp.controller';

@Module({
  controllers: [WeappController],
  providers: [UniService],
})
export default class UniModule {}
