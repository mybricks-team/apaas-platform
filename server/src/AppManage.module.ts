import { SchedulerRegistry } from "@nestjs/schedule";
import { Module } from "@nestjs/common";
import ProductServices from "./services/product";

import WorkspaceService from "./services/workspace";
import TaskController from "./services/task.controller";
import TaskService from "./services/task.service";
import FileDao from "./dao/FileDao";
import FileTaskDao from "./dao/FileTaskDao";
import { loadModule } from "./module-loader";
import ConfigService from "./services/config";
import AppsService from "./services/apps";
import IntelligenceService from './services/intelligence';
import FilePubDao from "./dao/filePub.dao";
import HomeService from "./services/home";
import ConfigDao from "./dao/config.dao";
import PublicService from "./services/public";
import UserGroupService from "./services/group";
import proxy from './services/proxy'

import FlowModule from './module/flow/flow.module'
import ModuleModule from './module/module/module.module'
import SystemModule from './module/system/system.module'
import FileModule from './module/file/file.module'
import DomainModule from "./module/domain/domain.module";
import ShareModule from "./module/share/share.module";
import UserModule from "./module/user/user.module";
import UserFileModule from "./module/userFile/userFile.module";
import UserGroupModule from "./module/userGroup/userGroup.module";

@Module({
  imports: [
    FlowModule,
    ModuleModule,
    SystemModule,
    FileModule,
    DomainModule,
    ShareModule,
    UserModule,
    UserFileModule,
    UserGroupModule,
    ...loadModule().modules,
  ],
  controllers: [
    AppsService,
    proxy,
    ProductServices,
    WorkspaceService,
    UserGroupService,
    TaskController,
    ConfigService,
    AppsService,
    HomeService,
    IntelligenceService,
    PublicService
  ],
  providers: [
    TaskService,
    SchedulerRegistry,
    FileDao,
    FileTaskDao,
    FilePubDao,
    ConfigDao
  ],
})
export default class AppManageModule {
  constructor() {}
}
