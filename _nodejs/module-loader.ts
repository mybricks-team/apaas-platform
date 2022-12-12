import * as path from "path";
import * as fs from "fs";

const scanDir = (dirFullPath: string) => {
  const modules = [];
  const namespace = [];
  if (fs.existsSync(dirFullPath)) {
    const folders = fs.readdirSync(dirFullPath);
    if (folders) {
      folders.forEach((dirPath) => {
        const installPath = path.join(dirFullPath, dirPath);
        if (installPath.indexOf("install.json") !== -1) {
          const register = require(installPath);
          if (typeof register === "object") {
            if (register.module && register.module.module) {
              modules.push(
                require(path.join(dirFullPath, register.module.module)).default
              );
            }
            namespace.push(`/${register.namespace}/`);
          }
        }
      });
    }
  }
  return {
    modules,
    namespace,
  };
};

export function loadModule() {
  let modules = [];
  let namespace = [];
  const appDir = path.join(process.cwd(), "../_apps");
  if (fs.existsSync(appDir)) {
    const folders = fs.readdirSync(appDir);
    if (folders) {
      folders.forEach((childPath) => {
        const appFullPath = path.join(appDir, childPath);
        const data = scanDir(appFullPath);
        modules = modules.concat(data.modules);
        namespace = namespace.concat(data.namespace);
      });
    }
  }
  return {
    modules,
    namespace,
  };
}
