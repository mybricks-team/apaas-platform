import { ScheduleModule, SchedulerRegistry } from "@nestjs/schedule";
import { Module, OnModuleInit } from "@nestjs/common";

import Task from './task/task';
import WorkspaceService from "./services/workspace";
import TaskController from "./services/task.controller";
import TaskService from "./services/task.service";
import FileDao from "./dao/FileDao";
import FileTaskDao from "./dao/FileTaskDao";
import { loadModule } from "./module-loader";
import FilePubDao from "./dao/filePub.dao";
import HomeService from "./services/home";
import ConfigDao from "./dao/config.dao";
import UserGroupService from "./services/group";
import proxy from './services/proxy'

import FlowModule from './module/flow/flow.module'
import ModuleModule from './module/module/module.module'
import SystemModule from './module/system/system.module'
import FileModule from './module/file/file.module'
import DomainModule from "./module/domain/domain.module";
import AssetModule from "./module/asset/asset.module";
import ShareModule from "./module/share/share.module";
import UserModule from "./module/user/user.module";
import UserFileModule from "./module/userFile/userFile.module";
import UserGroupModule from "./module/userGroup/userGroup.module";
import OssModule from './module/oss/oss.module'
import UserLogDao from './dao/UserLogDao';
import LogModule from './module/log/log.module'
import ConfigModule from "./module/config/config.module";
import AppModule from "./module/app/app.module";
import { DiscoveryService, Reflector } from "@nestjs/core";

const MethodMap = {
  0: 'GET',
  1: 'POST',
  2: 'PUT',
  3: 'DELETE',
};

@Module({
  imports: [
    FlowModule,
    ModuleModule,
    SystemModule,
    FileModule,
    DomainModule,
    AssetModule,
    ShareModule,
    UserModule,
    UserFileModule,
    UserGroupModule,
    OssModule,
    LogModule,
    ConfigModule,
    AppModule,
    ScheduleModule.forRoot(),
    ...loadModule().modules,
  ],
  controllers: [
    proxy,
    WorkspaceService,
    UserGroupService,
    TaskController,
    HomeService
  ],
  providers: [
    Task,
    TaskService,
    SchedulerRegistry,
    FileDao,
    FileTaskDao,
    FilePubDao,
    ConfigDao,
    UserLogDao,
    DiscoveryService
  ],
})
export default class AppManageModule implements OnModuleInit {
  constructor(private reflector: Reflector, private readonly discoveryService: DiscoveryService) {}

  onModuleInit() {
    try {
      const controllerInstances = this.discoveryService.getControllers();
      const controllerInstanceMap = controllerInstances.reduce((per, instance) => {
        return { ...per, [instance.name]: instance };
      }, {});
      const pathMap = {};
      controllerInstances.forEach(instance => {
        const prefix = this.reflector.get('path', instance.instance.constructor);
        Object.getOwnPropertyNames(instance.instance.__proto__)
          .filter(key => key !== 'constructor')
          .forEach(key => {
            const path = this.reflector.get('path', instance.instance[key]);
            const methodCode = this.reflector.get('method', instance.instance[key]);

            if (path === undefined || methodCode === undefined) {
              return;
            }

            pathMap[`${prefix}${path === '/' ? '' : path}[${MethodMap[methodCode]}]`] = {
              controller: instance.name,
              handler: key
            };
          })
      });

      global.emitGlobalEvent = async (path: string, method: string, ...args: any[]) => {
        const curHandler = pathMap[`${path}[${method}]`];

        return await controllerInstanceMap[curHandler.controller].instance[curHandler.handler](...args);
      };
    } catch (e) {
      console.log('获取服务所有 controller 失败：', e);
    }
    // 使用方式：global.emitGlobalEvent('/paas/api/flow/getAsset', 'GET', {}).then(res => console.log(res.data));
  }
}
