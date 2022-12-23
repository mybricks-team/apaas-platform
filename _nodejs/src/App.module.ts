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
import { loadModule } from "../module-loader";
import ConfigService from "./services/config";
import AppsService from "./services/apps";
import FileService from "./services/file";
import SystemService from "./services/system";
import FilePubDao from "./dao/filePub.dao";
import HomeService from "./services/home";
import ConfigDao from "./dao/config.dao";
@Module({
  imports: [...loadModule().modules],
  controllers: [
    AppsService,
    UserServices,
    ProductServices,
    WorkspaceService,
    TaskController,
    GroundService,
    ConfigService,
    AppsService,
    FileService,
    SystemService,
    HomeService,
  ],
  providers: [
    TaskService,
    SchedulerRegistry,
    FileDao,
    FileTaskDao,
    FilePubDao,
    ConfigDao,
  ],
})
export class AppModule {
  constructor() {}
}
