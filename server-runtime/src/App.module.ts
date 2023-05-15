import { Module } from "@nestjs/common";
import { ScheduleModule } from '@nestjs/schedule';
import DomainModule from "./module/domain/domain.module";
import ServerModule from "./module/server/server.module";
import AuthModule from "./module/auth/auth.module";
import StaticServeModule from "./module/staticServe/staticServe.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DomainModule,
    ServerModule,
    AuthModule,
    StaticServeModule
  ],
  controllers: [
  ],
  providers: [
  ],
})
export default class AppManage {
  constructor() {}
}
