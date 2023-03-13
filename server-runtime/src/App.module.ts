import { Module } from "@nestjs/common";
import DomainModule from "./module/domain/domain.module";

@Module({
  imports: [
    DomainModule
  ],
  controllers: [
  ],
  providers: [
  ],
})
export default class AppManage {
  constructor() {}
}
