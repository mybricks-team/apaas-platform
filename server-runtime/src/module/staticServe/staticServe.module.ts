import { Module } from '@nestjs/common';
import StaticServeController from './staticServe.controller';

@Module({
  controllers: [StaticServeController],
  providers: [],
  exports: [],
})
export default class StaticServeModule {}
