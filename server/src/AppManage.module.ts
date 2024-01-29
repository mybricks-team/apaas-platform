import { ScheduleModule, SchedulerRegistry } from "@nestjs/schedule";
import { Module, OnModuleInit } from "@nestjs/common";
import * as path from 'path';

import Task from './task/task';
import WorkspaceService from "./services/workspace";
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
import GPTModule from './module/gpt/gpt.module';

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
    GPTModule,
    ScheduleModule.forRoot(),
    ...loadModule().modules,
  ],
  controllers: [
    proxy,
    WorkspaceService,
    UserGroupService,
    HomeService
  ],
  providers: [
    Task,
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
      const repeatPathMap = {};
      controllerInstances.forEach(instance => {
        const prefix = this.reflector.get('path', instance.instance.constructor);
        Object.getOwnPropertyNames(instance.instance.__proto__)
          .filter(key => key !== 'constructor')
          .forEach(key => {
            const routerPath = this.reflector.get('path', instance.instance[key]);
            const methodCode = this.reflector.get('method', instance.instance[key]);

            if (routerPath === undefined || methodCode === undefined) {
              return;
            }

            let curPath = path.join(prefix, routerPath);
            if (!curPath.startsWith('/')) {
              curPath = '/' + curPath;
            }
            if (curPath.endsWith('/')) {
              curPath = curPath.slice(0, -1);
            }
            curPath += `[${MethodMap[methodCode]}]`;
            /** 兼容 windows */
            curPath = curPath.replace(/\\/g, '/').replace(/^\/\//, '/');


            const curMap = { controller: instance.name, handler: key };

            /** 统计重复路由 */
            if (pathMap[curPath]) {
              if (!Array.isArray(repeatPathMap[curPath])) {
                repeatPathMap[curPath] = [pathMap[curPath], curMap];
              } else {
                repeatPathMap[curPath] = [...repeatPathMap[curPath], curMap];
              }
            }

            pathMap[curPath] = curMap;
          })
      });

      /** 重复路由 */
      if (Object.keys(repeatPathMap).length) {
        Object.keys(repeatPathMap).forEach(key => {
          const [_, path, method] = key.match(/^([^\[]*)\[(.*)]$/);

          if(!global.MYBRICKS_PLATFORM_START_ERROR) {
            global.MYBRICKS_PLATFORM_START_ERROR = ''
          } else {
            global.MYBRICKS_PLATFORM_START_ERROR += '\n';
          }
          global.MYBRICKS_PLATFORM_START_ERROR += `路由重复错误：请求方法为 ${method} 且路径为 ${path} 的路由存在重复，分别来自 Controller 中 ${repeatPathMap[key].map(item => `${item.controller} 的 ${item.handler} 方法`).join('、')}`;
        });
      }

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
