import { Module } from "@nestjs/common";
import DomainModule from "./module/domain/domain.module";
import ServerModule from "./module/server/server.module";

@Module({
  imports: [
    DomainModule,
    ServerModule
  ],
  controllers: [
  ],
  providers: [
  ],
})
export default class AppManage {
  constructor() {}
}
