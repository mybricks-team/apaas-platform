import * as path from "path";
import * as fs from "fs";
import env from './utils/env'
import { isDirectory } from './utils/index'
import UserDao from './dao/UserDao';
const userDao = new UserDao();
import { Logger } from "@mybricks/rocker-commons";

const scanDir = (dirFullPath: string) => {
  const modules = [];
  const namespace = [];
  const middleware = [];
  const interceptor = [];
  if (fs.existsSync(dirFullPath)) {
    const folders = fs.readdirSync(dirFullPath);
    if (folders) {
      folders.forEach((dirPath) => {
        const pkgPath = path.join(dirFullPath, dirPath);
        if (pkgPath.indexOf("package.json") !== -1) {
          const pkg = require(pkgPath);
          if (typeof pkg === "object") {
            // 约定的根模块地址
            const rootModulePath = path.join(dirFullPath, './nodejs/index.module.ts')
            const middlewarePath = path.join(dirFullPath, './nodejs/middleware/index.middleware.ts')
            const interceptorPath = path.join(dirFullPath, './nodejs/interceptor/index.interceptor.ts')
            if(fs.existsSync(rootModulePath)) {
              modules.push(
                require(rootModulePath).default
              );
            }
            if(fs.existsSync(middlewarePath)) {
              const fn = require(middlewarePath).default
              const wrapperFn = fn({ userDao, Logger })
              middleware.push(wrapperFn)
            }
            if(fs.existsSync(interceptorPath)) {
              const fn = require(interceptorPath).default
              interceptor.push(fn)
            }
            namespace.push(`${pkg.name}`);
          }
        }
      });
    }
  }
  return {
    modules,
    namespace,
    middleware,
    interceptor
  };
};

export function loadModule() {
  let modules = [];
  let namespace = [];
  let middleware = [];
  let interceptor = [];
  const namespaceMap: any = {}
  try {
    const appDir = env.getAppInstallFolder()
    if (fs.existsSync(appDir)) {
      const folders = fs.readdirSync(appDir);
      if (folders) {
        for(let l=folders.length, i=0; i<l; i++) {
          const childPath = folders[i]
          try {
            const appFullPath = path.join(appDir, childPath);
            if(!isDirectory(appFullPath)) {
              Logger.info(`模块 ${childPath} 不合法，跳过`)
              continue
            }
            const data = scanDir(appFullPath);
            modules = modules.concat(data.modules);
            middleware = middleware.concat(data.middleware);
            interceptor = interceptor.concat(data.interceptor);
            namespaceMap[data?.namespace?.[0]] = {
              hasService: data.modules?.length !== 0
            }
            namespace = namespace.concat(data.namespace);
          } catch(e) {
            if(!global.MYBRICKS_PLATFORM_START_ERROR) {
              global.MYBRICKS_PLATFORM_START_ERROR = ''
            }
            global.MYBRICKS_PLATFORM_START_ERROR += `\n 模块 ${childPath} 加载失败 \n 错误是：${e.message} \n 详情是: ${e?.stack?.toString()}`;
            Logger.info(`模块加载失败, 准备跳过：${e.message}`)
            Logger.info(`错误详情是: ${e?.stack?.toString()}`)
            continue;
          }
        }
      }
    }
  } catch(e) {
    if(!global.MYBRICKS_PLATFORM_START_ERROR) {
      global.MYBRICKS_PLATFORM_START_ERROR = ''
    }
    global.MYBRICKS_PLATFORM_START_ERROR += `\n 错误详情是：${e.message}`;
    Logger.info(`模块加载失败：${e.message}`)
    Logger.info(`${e?.stack?.toString()}`)
  }
  const res = {
    modules,
    namespace,
    middleware,
    interceptor,
    namespaceMap
  };
  return res
}
