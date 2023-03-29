import { Module } from "@nestjs/common";
import { ScheduleModule } from '@nestjs/schedule';
import DomainModule from "./module/domain/domain.module";
import TaskModule from "./module/task/task.module";
import ServerModule from "./module/server/server.module";
import AuthModule from "./module/auth/auth.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DomainModule,
    ServerModule,
    TaskModule,
    AuthModule
  ],
  controllers: [
  ],
  providers: [
  ],
})
export default class AppManage {
  constructor() {}
}
