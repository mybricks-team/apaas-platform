import { Body, Controller, Get, Post, Query, Req, Headers } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { Logger } from '@mybricks/rocker-commons'
import AppDao from '../dao/AppDao';
import * as axios from 'axios';
import env from '../utils/env'
import UserLogDao from '../dao/UserLogDao';

@Controller("/paas/api/apps")
export default class AppsService {
  appDao: AppDao;
  userLogDao: UserLogDao;
  // 控制是否重启
  shouldReload: boolean;
  // 是否正在重启
  isReloading: boolean;
  // 是否升级成功
  isSuccessUpgrade: boolean;

  constructor() {
    this.appDao = new AppDao();
    this.userLogDao = new UserLogDao();
    this.isReloading = false;
    this.isSuccessUpgrade = false;
    this.shouldReload = false;
  }

  async getAllInstalledList({ filterSystemApp }: {filterSystemApp: boolean}) {
    const appsFolder = env.getAppInstallFolder()
    if (!fs.existsSync(appsFolder)) {
      return []
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
          // 处理安装失败导致的异常数据
          if (Object.keys(pkgJson).length === 0) {
            continue;
          }
          if(appName.indexOf('_temp') !== -1) {
            continue
          }
          // 忽略平台型模块
          if(filterSystemApp && pkgJson?.mybricks?.type === 'system') {
            continue
          }
          const temp: any = {
            version: pkgJson?.version,
            homepage: `/${pkgJson.name}/index.html`, // 约定
            title: pkgJson?.mybricks?.title,
            namespace: pkgJson.name,
            description: pkgJson.description,
            icon: pkgJson?.mybricks?.icon,
            type: pkgJson?.mybricks?.type,
            extName: pkgJson?.mybricks?.extName,
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
          // 应用设置页面
          if (pkgJson?.mybricks?.groupSetting) {
            temp["groupSetting"] = pkgJson?.mybricks?.groupSetting;
          } else if (
            fs.existsSync(
              path.join(appsFolder, appName, "./assets/groupSetting.html")
            )
          ) {
            // 约定的设置字段
            temp["groupSetting"] = `/${pkgJson.name}/groupSetting.html`; // 约定
          }
          if(
            fs.existsSync(
              path.join(appsFolder, appName, "./assets/index.html")
            )
          ) {
            temp["_hasPage"] = true; // 约定
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
    return apps
  }

  @Get("/getInstalledList")
  async getInstalledList() {
    const apps = await this.getAllInstalledList({ filterSystemApp: true })
    return {
      code: 1,
      data: apps,
      msg: '成功'
    };
  }

  @Get("/getLatestAll")
  async getLatestAll(@Headers('username') us: string, ) {
    let allApps;
    if(us && us !== 'zouyongsheng') {
      allApps = await this.appDao.queryLatestApp({ creatorName: us });
    } else {
      allApps = await this.appDao.queryLatestApp();
    }
    return {
      code: 1,
      data: allApps,
    };
  }

  @Get("/getLatestAllFromSource")
  async getLatestAllFromSource() {
    try {
      const localAppList = await this.appDao.queryLatestApp();
      let remoteAppList = []
      let mergedList = []
      try {
        const currentInstallList = (await this.getAllInstalledList({ filterSystemApp: true }))?.map(i => {
          return {
            namespace: i.namespace,
            version: i.version,
            extName: i.extName,
            title: i.title,
          }
        })
        if(env.isPlatform_Fangzhou()) {
          remoteAppList = await this.appDao.queryLatestApp(); 

          // const temp = JSON.parse(require('child_process').execSync(`
          //   curl -x 10.28.121.13:11080  --location --request POST 'https://my.mybricks.world/central/api/channel/gateway' --header 'Content-Type: application/json' --data '{"action": "app_getAllLatestList"}'
          // `).toString())
          // if(temp.code === 1) {
          //   remoteAppList = temp.data
          // }
        } else {
          const temp = (await (axios as any).post(
            // "http://localhost:4100/central/api/channel/gateway", 
            "https://my.mybricks.world/central/api/channel/gateway", 
            {
              action: 'app_getAllLatestList',
              payload: JSON.stringify(currentInstallList)
            }
          )).data;
          if(temp.code === 1) {
            remoteAppList = temp.data
          }
          // 远端app地址增加标记位
          remoteAppList?.forEach(i => {
            i.isFromCentral = true
            // 回滚版本也加上标记位
            if(i.previousList) {
              i.previousList?.forEach(j => {
                j.isFromCentral = true
              })
            }
          })
        }
        let tempList = localAppList.concat(remoteAppList)
        // 去重: 本地优先级更高
        let nsMap = {}
        tempList?.forEach(i => {
          if(!nsMap[i.namespace]) {
            mergedList.push(i)
            nsMap[i.namespace] = true
          }
        }) 
      } catch(e) {
        console.log(e)
      }

      return {
        code: 1,
        data: mergedList
      }
    } catch (e) {
      return {
        code: -1,
        data: [],
        msg: e.toString()
      }
    }
  }

  @Post("/update")
  async appUpdate(@Body() body, @Req() req) {
    const { namespace, version, isFromCentral, userId } = body;
    const applications = require(path.join(process.cwd(), './application.json'));

    let remoteApps = [];
    try {
      if(isFromCentral) {
        const temp = (await (axios as any).post(
          // "http://localhost:4100/central/api/channel/gateway", 
          "https://my.mybricks.world/central/api/channel/gateway", 
          {
            action: 'app_checkLatestVersion',
            payload: { namespace }
          }
        )).data;
        if(temp.code === 1) {
          remoteApps = temp.data
        }
      } else {
        remoteApps = await this.appDao.queryLatestApp();
      }
    } catch (e) {
      Logger.info(`获取远程应用版本失败: ${e}`);
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
    const remoteAppInstallInfo = JSON.parse(remoteApp.installInfo || "{}");
    /** 已安装应用 */
    let installedApp = null;
    let installedIndex = null;
    let installPkgName = "";
    let logInfo = null;
    applications.installApps.forEach((app, index) => {
      if(app.type === 'npm') {
        if (app.path?.indexOf(namespace) !== -1) {
          installedApp = app;
          installedIndex = index;
        }
      } else if(app.type === 'oss') {
        if (app.namespace?.indexOf(namespace) !== -1) {
          installedApp = app;
          installedIndex = index;
        }
      }
    });

    if (!installedApp) {
      /** 新加应用 */
      installPkgName = remoteApp.namespace;
      if(remoteApp.installType === 'oss') {
        applications.installApps.push({
          type: "oss",
          path: remoteAppInstallInfo.ossPath,
          namespace: remoteApp.namespace,
          version: version,
        });
      } else if(remoteApp.installType === 'local') {
        applications.installApps.push({
          type: "local",
          version: version,
          namespace: installPkgName,
          path: ''
        });
      } else {
        applications.installApps.push({
          type: "npm",
          version: version,
          namespace: installPkgName,
          path: `${installPkgName}@${version}`,
        });
      }

      logInfo = {
        action: 'install',
        type: 'application',
        installType: remoteApp.installType || 'npm',
        preVersion: '',
        version,
        namespace: installPkgName,
        name: remoteApp.name || installPkgName,
        content: '安装新应用：' + (remoteApp.name || installPkgName) + '，版本号：' + version,
      };
    } else {
      let preVersion = installedApp.version;
      // 升级版本
      if(installedApp.type === 'npm') {
        preVersion = installedApp.path.split('@')[1];
        installPkgName = installedApp.path.substr(0, installedApp.path.lastIndexOf('@'))
        installedApp.path = `${installPkgName}@${version}`;
        applications.installApps.splice(installedIndex, 1, installedApp);
      } else if(installedApp.type === 'oss') {
        installPkgName = installedApp.namespace
        installedApp.version = version
        installedApp.path = remoteAppInstallInfo.ossPath
        applications.installApps.splice(installedIndex, 1, installedApp);
      } else if(installedApp.type === 'local') {
        installPkgName = installedApp.namespace
        installedApp.version = version
        applications.installApps.splice(installedIndex, 1, installedApp);
      }

      if (['npm', 'oss', 'local'].includes(installedApp.type)) {
        logInfo = {
          action: 'install',
          type: 'application',
          installType: remoteApp.installType,
          preVersion,
          version,
          namespace: installPkgName,
          name: remoteApp.name || installPkgName,
          content: `更新应用：${remoteApp.name || installPkgName}，版本从 ${preVersion} 到 ${version}`,
        };
      }

      console.log('更新版本', installedApp)
    }
    const rawApplicationStr = fs.readFileSync(
      path.join(process.cwd(), "./application.json"),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(process.cwd(), "./application.json"),
      JSON.stringify(applications, undefined, 2)
    );

    Logger.info("准备应用成功, 开始安装应用");
    try {
      const logStr = childProcess.execSync("node installApplication.js", {
        cwd: path.join(process.cwd()) // 不能inherit输出
      });
      Logger.info(`安装应用日志是: ${logStr}`)
      if (logStr?.indexOf("npm ERR") !== -1) {
        fs.writeFileSync(
          path.join(process.cwd(), "./application.json"),
          rawApplicationStr
        );
        // 往回回退安装
        childProcess.execSync("node installApplication.js", {
          cwd: path.join(process.cwd()) // 不能inherit输出
        });
        if (logInfo) {
          await this.userLogDao.insertLog({ type: 9, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });
        }
        return { code: -1, message: logStr.toString() };
      }
    } catch (e) {
      if (logInfo) {
        await this.userLogDao.insertLog({ type: 9, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });
        logInfo = null;
      }
      Logger.info(e.message);
    }

    if (logInfo) {
      await this.userLogDao.insertLog({ type: 9, userId, logContent: JSON.stringify({ ...logInfo, status: 'success' }) });
    }
    try {
      const serverModulePath = path.join(
        env.getAppInstallFolder(),
        `./${installPkgName}/nodejs/index.module.ts`
      );
      if (fs.existsSync(serverModulePath)) {
        if(remoteAppInstallInfo?.noServiceUpdate) {
          Logger.info("有service，但是未更新服务端，无需重启");
        } else {
          Logger.info("有service，即将重启服务");
          childProcess.exec(
            `npx pm2 reload ${env.getAppThreadName()}`,
            {
              cwd: path.join(process.cwd()),
            },
            (error, stdout, stderr) => {
              if (error) {
                Logger.info(`exec error: ${error}`);
                return;
              }
              Logger.info(`stdout: ${stdout}`);
              Logger.info(`stderr: ${stderr}`);
            }
          );
        }

      } else {
        Logger.info("无service，无需重启");
      }
    } catch (e) {
      Logger.info(e);
    }
    return { code: 1, data: null, message: "安装成功" };
  }

  @Get("/update/status")
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
        if(a.type === 'oss') {
          const pkgName = a.namespace
          const pkgVersion = a.version
          return pkgName === namespace && version === pkgVersion;
        } else if(a.type === 'npm') {
          const index = a.path.lastIndexOf("@");
          const pkgName = a.path.substr(0, index);
          const pkgVersion = a.path.substr(index + 1);
          // const [pkgName, pkgVersion] = a.path.split("@");
          return pkgName === namespace && version === pkgVersion;
        }
      });
      if (app) {
        return {
          code: 1,
          message: "重启成功",
        };
      }
    } catch (e) {
      Logger.info("安装应用失败");
      Logger.info(e);
    }
    return { code: -1, data: null, message: "安装应用失败" };
  }

  @Post("/register")
  async createApp(@Body() body) {
    const {
      name,
      namespace,
      icon,
      description,
      install_info,
      version,
      user_id,
      creator_name,
    } = body;
    const install_type = body.install_type || "npm";
    const type = body.install_type || "user";
    if (
      !name ||
      !namespace ||
      !icon ||
      !description ||
      !install_info ||
      !version ||
      !user_id
    ) {
      return {
        code: 0,
        message:
          "参数 name, namespace, icon, description, install_type, type, install_info, version, user_id 不能为空",
      };
    }

    const [app] = await this.appDao.getAppByNamespace_Version(
      namespace,
      version
    );

    if (app) {
      return { code: 0, msg: "应用对应版本已存在" };
    }

    await this.appDao.insertApp({ ...body, install_type, type, create_time: Date.now() });
    await this.userLogDao.insertLog({
      type: 9,
      userEmail: creator_name,
      userId: user_id,
      logContent: JSON.stringify({
        type: 'application',
        action: 'register',
        namespace,
        name,
        version,
        content: `注册应用：${name || namespace} 版本号：${version}`,
      })
    });

    return {
      code: 1,
      msg: "发布成功",
    };
  }
}
