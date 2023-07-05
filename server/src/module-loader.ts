import * as path from "path";
import * as fs from "fs";
import env from './utils/env'
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
              const wrapperFn = fn({ userDao })
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
          if(childPath === '.DS_Store') {
            continue;
          }
          const appFullPath = path.join(appDir, childPath);
          const data = scanDir(appFullPath);
          modules = modules.concat(data.modules);
          middleware = middleware.concat(data.middleware);
          interceptor = interceptor.concat(data.interceptor);
          namespaceMap[data?.namespace?.[0]] = {
            hasService: data.modules?.length !== 0
          }
          namespace = namespace.concat(data.namespace);
        }
      }
    }
  } catch(e) {
    Logger.info(`模块加载失败：${e.message}`)
  }
  return {
    modules,
    namespace,
    middleware,
    interceptor,
    namespaceMap
  };
}
