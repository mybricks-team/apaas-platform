import { Module } from '@nestjs/common';
import AuthService from './auth.service';
import AuthController from './auth.controller';
import SessionService from '../session/session.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService],
  exports: [AuthService, SessionService],
})
export default class DomainModule {}
