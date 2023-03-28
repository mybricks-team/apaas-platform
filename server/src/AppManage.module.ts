import { SchedulerRegistry } from "@nestjs/schedule";
import { Module } from "@nestjs/common";
import { UserServices } from "./services/user";
import ProductServices from "./services/product";

import WorkspaceService from "./services/workspace";
import GroundService from "./services/ground";
import TaskController from "./services/task.controller";
import TaskService from "./services/task.service";
import FileDao from "./dao/FileDao";
import FileTaskDao from "./dao/FileTaskDao";
import { loadModule } from "./module-loader";
import ConfigService from "./services/config";
import AppsService from "./services/apps";
import IntelligenceService from './services/intelligence';
import LifecycleService from './services/lifecycle'
import FilePubDao from "./dao/filePub.dao";
import HomeService from "./services/home";
import ConfigDao from "./dao/config.dao";
import PublicService from "./services/public";
import UserGroupService from "./services/group";

import FlowModule from './module/flow/flow.module'
import ModuleModule from './module/module/module.module'
import SystemModule from './module/system/system.module'
import FileModule from './module/file/file.module'
import DomainModule from "./module/domain/domain.module";

@Module({
  imports: [
    FlowModule,
    ModuleModule,
    SystemModule,
    FileModule,
    DomainModule,
    ...loadModule().modules,
  ],
  controllers: [
    AppsService,
    UserServices,
    ProductServices,
    WorkspaceService,
    UserGroupService,
    TaskController,
    GroundService,
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
    LifecycleService,
    ConfigDao
  ],
})
export default class AppManageModule {
  constructor() {}
}
