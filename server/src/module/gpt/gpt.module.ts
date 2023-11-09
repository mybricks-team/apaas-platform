import { Module } from '@nestjs/common';
import GPTController from './gpt.controller';

@Module({
  controllers: [GPTController],
  providers: []
})
export default class GPTModule {}
