import * as path from "path";
import * as fs from "fs";

const scanDir = (dirFullPath: string) => {
  const modules = [];
  const namespace = [];
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
            if(fs.existsSync(rootModulePath)) {
              modules.push(
                require(rootModulePath).default
              );
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
