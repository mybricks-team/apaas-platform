import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import { safeParse, versionGreaterThan } from "../utils";
import AppDao from "../dao/AppDao";
import * as axios from "axios";

@Controller("/paas/api")
export default class AppsService {
  appDao: AppDao;
  // 控制是否重启
  shouldReload: boolean;
  // 是否正在重启
  isReloading: boolean;
  // 是否升级成功
  isSuccessUpgrade: boolean;

  constructor() {
    this.appDao = new AppDao();
    this.isReloading = false;
    this.isSuccessUpgrade = false;
    this.shouldReload = false;
  }

  @Get("/apps/getInstalledList")
  async getInstalledList() {
    const appsFolder = path.join(process.cwd(), "../_apps");
    if (!fs.existsSync(appsFolder)) {
      return {
        code: 1,
        data: [],
      };
    }
    const dirNames = fs.readdirSync(appsFolder);
    const apps = [];
    if (Array.isArray(dirNames)) {
      for (let l = dirNames.length, i = 0; i < l; i++) {
        const appName = dirNames[i];
        let pkgJson: any = {};
        const pkgFilePath = path.join(appsFolder, appName, "./package.json");
        if (fs.existsSync(pkgFilePath)) {
          pkgJson = JSON.parse(fs.readFileSync(pkgFilePath, "utf-8"));
          // @ts-ignore
          if (Object.keys(pkgJson).length === 0) {
            continue;
          }
          const temp: any = {
            version: pkgJson?.version,
            homepage: `/${pkgJson.name}/index.html`, // 约定
            title: pkgJson?.mybricks?.title,
            namespace: pkgJson.name,
            description: pkgJson.description,
            icon: pkgJson?.mybricks?.icon,
            type: pkgJson?.mybricks?.type,
            exports: [],
          };
          // 应用设置页面
          if (pkgJson?.mybricks?.setting) {
            temp["setting"] = pkgJson?.mybricks?.setting;
          } else if (
            fs.existsSync(
              path.join(appsFolder, appName, "./assets/setting.html")
            )
          ) {
            // 约定的设置字段
            temp["setting"] = `/${pkgJson.name}/setting.html`; // 约定
          }
          // 应用导出能力
          if (pkgJson?.mybricks?.serviceProvider) {
            for (let serviceName in pkgJson?.mybricks?.serviceProvider) {
              const val = pkgJson?.mybricks?.serviceProvider[serviceName];
              temp.exports.push({
                name: serviceName,
                path: `/${pkgJson.name}/${val}`,
              });
            }
          }
          if (pkgJson?.mybricks?.isSystem) {
            temp["isSystem"] = pkgJson?.mybricks?.isSystem;
          }
          apps.push(temp);
        }
      }
    }
    return {
      code: 1,
      data: apps,
    };
  }

  @Get("/apps/getLatestAll")
  async getLatestAll() {
    const allApps = await this.appDao.queryLatestApp();
    return {
      code: 1,
      data: allApps,
    };
  }

  @Get("/apps/getLatestAllFromSource")
  async getLatestAllFromSource() {
    const appRes = await (axios as any).get(
      "https://mybricks.world/api/apps/getLatestAll"
    );
    return appRes?.data;
  }

  @Get("/apps/update/check")
  async checkAppUpdate() {
    const applications = require(path.join(
      process.cwd(),
      "./application.json"
    ));

    let remoteApps = [];
    try {
      const appRes = await (axios as any).get(
        "https://mybricks.world/api/apps/getLatestAll"
      );
      remoteApps = appRes.data.data || [];
    } catch (e) {
      console.log("获取远程应用版本失败", e);
    }

    if (!remoteApps.length) {
      return { code: 1, data: [] };
    }

    const res = [];
    for (const app of applications.installApps) {
      const [_name, version] = app.path.split("@");

      const remoteApp = remoteApps.find((r) => r.namespace === _name);

      if (remoteApp && versionGreaterThan(remoteApp.version, version)) {
        res.push({
          name: remoteApp.name,
          namespace: remoteApp.namespace,
          icon: remoteApp.icon,
          description: remoteApp.description,
          version: remoteApp.version,
        });
      }
    }

    return {
      code: 1,
      data: res,
    };
  }

  @Post("/apps/update")
  async appUpdate(@Body() body, @Req() req) {
    const { namespace, version } = body;

    const applications = require(path.join(
      process.cwd(),
      "./application.json"
    ));

    let remoteApps = [];
    try {
      const appRes = await (axios as any).get(
        "https://mybricks.world/api/apps/getLatestAll"
      );
      remoteApps = appRes.data.data || [];
    } catch (e) {
      console.log("获取远程应用版本失败", e);
    }

    if (!remoteApps.length) {
      return { code: 0, message: "升级失败，查询最新应用失败" };
    }

    /** 应用中心是否存在此应用 */
    const remoteApp = remoteApps.find((a) => a.namespace === namespace);

    /** 不存在返回错误 */
    if (!remoteApp) {
      return { code: 0, message: "升级失败，不存在此应用" };
    }
    /** 已安装应用 */
    let installedApp = null;
    let installedIndex = null;
    let installPkgName = "";
    applications.installApps.forEach((app, index) => {
      if (app.path?.indexOf(namespace) !== -1) {
        installedApp = app;
        installedIndex = index;
      }
    });

    if (!installedApp) {
      /** 新加应用 */
      installPkgName = safeParse(remoteApp.installInfo).pkgName;
      applications.installApps.push({
        type: "npm",
        path: `${installPkgName}@${version}`,
      });
    } else {
      // 升级版本
      installPkgName = installedApp.path.split("@")[0];
      installedApp.path = `${installPkgName}@${version}`;
      applications.installApps.splice(installedIndex, 1, installedApp);
    }
    const rawApplicationStr = fs.readFileSync(
      path.join(process.cwd(), "./application.json"),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(process.cwd(), "./application.json"),
      JSON.stringify(applications, undefined, 2)
    );

    console.log("准备应用成功");

    try {
      const logStr = childProcess.execSync("node installApplication.js", {
        cwd: path.join(process.cwd()),
      });
      if (logStr.indexOf("npm ERR") !== -1) {
        fs.writeFileSync(
          path.join(process.cwd(), "./application.json"),
          rawApplicationStr
        );
        // 往回回退安装
        childProcess.execSync("node installApplication.js", {
          cwd: path.join(process.cwd()),
        });
        return { code: -1, message: logStr.toString() };
      }
    } catch (e) {
      console.log(e.toString());
    }
    try {
      const serverModulePath = path.join(
        process.cwd(),
        `../_apps/${installPkgName}/nodejs/index.module.ts`
      );
      if (fs.existsSync(serverModulePath)) {
        console.log("有service，即将重启服务");
        childProcess.exec(
          "npx pm2 reload index",
          {
            cwd: path.join(process.cwd()),
          },
          (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
          }
        );
      } else {
        console.log("无service，无需重启");
      }
    } catch (e) {
      console.log(e);
    }
    return { code: 1, data: null, message: "安装成功" };
  }

  @Get("/apps/update/status")
  async checkAppUpdateStatus(
    @Query("namespace") namespace: string,
    @Query("version") version: string
  ) {
    // 重启服务
    try {
      const appPkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "./application.json"), "utf-8")
      );
      const app = appPkg?.installApps?.find((a) => {
        const [pkgName, pkgVersion] = a.path.split("@");
        return pkgName === namespace && version === pkgVersion;
      });
      if (app) {
        return {
          code: 1,
          message: "重启成功",
        };
      }
    } catch (e) {
      console.log("服务重启失败");
      console.log("安装应用失败");
      console.log(e);
    }
    return { code: -1, data: null, message: "安装应用失败" };
  }

  @Post("/apps/register")
  async createApp(@Body() body) {
    const {
      name,
      namespace,
      icon,
      description,
      install_type,
      type,
      install_info,
      version,
      creator_name,
    } = body;

    if (
      !name ||
      !namespace ||
      !icon ||
      !description ||
      !install_type ||
      !type ||
      !install_info ||
      !version ||
      !creator_name
    ) {
      return {
        code: 0,
        message:
          "参数 name, namespace, icon, description, install_type, type, install_info, version, creator_name 不能为空",
      };
    }

    const [app] = await this.appDao.getAppByNamespace_Version(
      namespace,
      version
    );

    if (app) {
      return { code: 0, message: "应用对应版本已存在" };
    }

    await this.appDao.insertApp({ ...body, create_time: Date.now() });

    return {
      code: 1,
      message: "创建成功",
    };
  }
}
