import { Body, Controller, Get, Post, Query, Req, Headers, UseInterceptors, UploadedFile } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import { FileInterceptor } from '@nestjs/platform-express';
import { Logger } from '@mybricks/rocker-commons'
import AppDao from '../../dao/AppDao';
import * as axios from 'axios';
import env from '../../utils/env'
import UserLogDao from '../../dao/UserLogDao';
import { lockUpgrade, unLockUpgrade } from '../../utils/lock';
import ConfigService from '../config/config.service';
import AppService from './app.service';
import { USER_LOG_TYPE } from '../../constants'
const fse = require('fs-extra');
const parse5 = require('parse5');
const { getAppThreadName, APPS_BASE_FOLDER } = require('../../../env.js')
const { injectAjaxScript, travelDom, injectAppConfigScript } = require('../../../util');

@Controller("/paas/api/apps")
export default class AppController {
  appDao: AppDao;
  userLogDao: UserLogDao;
  // 控制是否重启
  shouldReload: boolean;
  // 是否正在重启
  isReloading: boolean;
  // 是否升级成功
  isSuccessUpgrade: boolean;

  configService: ConfigService;

  appService: AppService;

  constructor() {
    this.appDao = new AppDao();
    this.userLogDao = new UserLogDao();
    this.isReloading = false;
    this.isSuccessUpgrade = false;
    this.shouldReload = false;
    this.configService = new ConfigService();
    this.appService = new AppService();
  }

  @Get("/getInstalledList")
  async getInstalledList() {
    const apps = await this.appService.getAllInstalledList({ filterSystemApp: true })
    return {
      code: 1,
      data: apps,
      msg: '成功!'
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
    const systemConfig = await this.configService.getConfigByScope(['system'])
    if(systemConfig?.system?.config?.isPureIntranet) {
      return {
        code: 1,
        data:[],
        msg: '纯内网部署，暂不支持此功能'
      }
    }
    try {
      const localAppList = await this.appDao.queryLatestApp();
      let remoteAppList = []
      let mergedList = []
      try {
        const currentInstallList = (await this.appService.getAllInstalledList({ filterSystemApp: true }))?.map(i => {
          return {
            namespace: i.namespace,
            version: i.version,
            extName: i.extName,
            title: i.title,
          }
        })
        if(env.isPlatform_Fangzhou()) {
          remoteAppList = await this.appDao.queryLatestApp(); 
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
        Logger.info(e.message)
        Logger.info(e?.stack?.toString())
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
    const logPrefix = `[安装应用 ${namespace}@${version}]：`;
    const systemConfig = await this.configService.getConfigByScope(['system'])
    try {
      if(systemConfig?.system?.config?.openConflictDetection) {
        Logger.info(logPrefix + '开启了冲突检测')
        await lockUpgrade()
      }
    } catch(e) {
      Logger.info(logPrefix + e.message)
      Logger.info(logPrefix + e?.stack?.toString())
      return {
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      }
    }
    const applications = require(path.join(process.cwd(), './application.json'));

    let remoteApps = [];
    try {
      if(isFromCentral) {
        const temp = (await (axios as any).post(
          // "http://localhost:4100/central/api/channel/gateway", 
          "https://my.mybricks.world/central/api/channel/gateway", 
          {
            action: 'app_getAppByNamespace_Version',
            payload: { namespace, version }
          }
        )).data;
        if(temp.code === 1) {
          remoteApps = temp.data
        }
      } else {
        remoteApps = await this.appDao.queryLatestApp();
      }
    } catch (e) {
      Logger.info(`${logPrefix}获取远程应用版本失败: ${e?.stack?.toString()}`);
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
    Logger.info(`${logPrefix} 安装应用的最新版本：${remoteApp.version}`);
    const remoteAppInstallInfo = JSON.parse(remoteApp.installInfo || "{}");
    /** 已安装应用 */
    let installedApp = null;
    let installedIndex = null;
    let installPkgName = "";
    let logInfo = null;
    let needServiceUpdate = !remoteAppInstallInfo?.noServiceUpdate;
    applications.installApps.forEach((app, index) => {
      if(app.type === 'npm') {
        if (app.path?.indexOf(`${namespace}@`) !== -1) {
          installedApp = app;
          installedIndex = index;
        }
      } else if(app.type === 'oss') {
        if (app.namespace === namespace) {
          installedApp = app;
          installedIndex = index;
        }
      } else if(app.type === 'local') {
        if (app.namespace === namespace) {
          installedApp = app;
          installedIndex = index;
        }
      }
    });

    if (!installedApp) {
      needServiceUpdate = true;
      /** 新加应用 */
      installPkgName = remoteApp.namespace;
      if(remoteApp.installType === 'oss') {
        applications.installApps.push({
          type: "oss",
          path: remoteAppInstallInfo.ossPath,
          namespace: remoteApp.namespace,
          version: version,
        });
      } else {
        applications.installApps.push({
          type: "npm",
          version: version,
          namespace: installPkgName,
          path: `${installPkgName}@${remoteApp.version}`,
        });
      }

      logInfo = {
        action: 'install',
        type: 'application',
        installType: remoteApp.installType || 'npm',
        preVersion: '',
        version: remoteApp.version,
        namespace: installPkgName,
        name: remoteApp.name || installPkgName,
        content: '安装新应用：' + (remoteApp.name || installPkgName) + '，版本号：' + version,
      };
    } else {
      installPkgName = remoteApp.namespace;
      let preVersion = installedApp.version;
      installedApp.type = 'oss';
      installedApp.version = remoteApp.version;
      installedApp.namespace = namespace;
      installedApp.path = remoteAppInstallInfo.ossPath;
      applications.installApps.splice(installedIndex, 1, installedApp);
      if (!needServiceUpdate) {
        const temp = (await (axios as any).post(
          "https://my.mybricks.world/central/api/channel/gateway",
          {
            action: 'app_checkServiceUpdateByNamespaceAndVersion',
            payload: JSON.stringify({ namespace, version: preVersion, nextVersion: remoteApp.version }),
          }
        )).data;
        if(temp.code === 1) {
          needServiceUpdate = temp.data?.needServiceUpdate;
        }
      }

      if (['npm', 'oss'].includes(installedApp.type)) {
        logInfo = {
          action: 'install',
          type: 'application',
          installType: remoteApp.installType,
          preVersion,
          version,
          namespace: installPkgName,
          name: remoteApp.name || installPkgName,
          content: `更新应用：${remoteApp.name || installPkgName}，版本从 ${preVersion} 到 ${remoteApp.version}`,
        };
      }

      Logger.info(logPrefix + '更新版本', installedApp)
    }
    const rawApplicationStr = fs.readFileSync(
      path.join(process.cwd(), './application.json'),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(process.cwd(), "./application.json"),
      JSON.stringify(applications, undefined, 2)
    );

    Logger.info(logPrefix + "准备应用成功, 开始安装应用");

    const serverModulePath = path.join(
      env.getAppInstallFolder(),
      `./${installPkgName}/nodejs/index.module.ts`
    );
    if (fs.existsSync(serverModulePath) && needServiceUpdate && logInfo) {
      logInfo.content += ', 服务已更新'
    }

    try {
      const logStr = childProcess.execSync("node installApplication.js", {
        cwd: path.join(process.cwd()) // 不能inherit输出
      });
      Logger.info(`${logPrefix}安装应用日志是: ${logStr}`)
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
          await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });
        }
        return { code: -1, message: logStr.toString() };
      }
    } catch (e) {
      if (logInfo) {
        await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });
        logInfo = null;
      }
      Logger.info(logPrefix + e.message);
      Logger.info(logPrefix + e?.stack?.toString())
    }

    if (logInfo) {
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'success' }) });
    }
    try {
      if (fs.existsSync(serverModulePath)) {
        if(!needServiceUpdate) {
          Logger.info(logPrefix + "有service，但是未更新服务端，无需重启");
        } else {
          Logger.info(logPrefix + "有service，即将重启服务");
          childProcess.exec(
            `npx pm2 reload ${getAppThreadName()}`,
            {
              cwd: path.join(process.cwd()),
            },
            (error, stdout, stderr) => {
              if (error) {
                Logger.info(logPrefix + `exec error: ${error}`);
                return;
              }
              Logger.info(logPrefix + `stdout: ${stdout}`);
              Logger.info(logPrefix + `stderr: ${stderr}`);
            }
          );
        }

      } else {
        Logger.info(logPrefix + "无service，无需重启");
      }
    } catch (e) {
      Logger.info(logPrefix + e.message);
      Logger.info(logPrefix + e?.stack?.toString())
    }

    if(systemConfig?.system?.config?.openConflictDetection) {
      Logger.info(logPrefix + "解锁成功，可继续升级应用");
      // 解锁
      await unLockUpgrade({ force: true })
    }
    return { code: 1, data: null, message: "安装成功" };
  }

  @Post("/uninstall")
  async uninstallApp(@Body() body, @Req() req) {
    const { namespace, userId, name } = body;
    const logPrefix = `[卸载应用 ${namespace}]：`;
    const systemConfig = await this.configService.getConfigByScope(['system'])
    try {
      if(systemConfig?.system?.config?.openConflictDetection) {
        Logger.info(logPrefix + '开启了冲突检测')
        await lockUpgrade()
      }
    } catch(e) {
      Logger.info(logPrefix + e.message)
      Logger.info(logPrefix + e?.stack?.toString())
      return {
        code: -1,
        msg: '当前已有系统任务，请稍后重试'
      }
    }
    const applications = require(path.join(process.cwd(), './application.json'));
    const originApplications = JSON.parse(JSON.stringify(applications));

    /** 应用中心是否存在此应用 */
    const curInstallAppIndex = applications.installApps.findIndex((app) => {
      return app.namespace === namespace || (app.type === 'npm' && app.path?.startsWith(`${namespace}@`));
    });
    const curInstallApp = applications.installApps[curInstallAppIndex];

    /** 不存在返回错误 */
    if (curInstallAppIndex < 0 || !curInstallApp) {
      return { code: 0, message: "卸载失败，不存在此应用" };
    }

    Logger.info(`${logPrefix} 版本号：${curInstallApp.version}`);
    const logInfo = {
      action: 'uninstall',
      type: 'application',
      installType: curInstallApp.installType,
      preVersion: curInstallApp.version,
      version: curInstallApp.version,
      namespace,
      name: name || namespace,
      content: `卸载应用：${name || namespace}，版本号：${curInstallApp.version}`,
    };
    applications.installApps.splice(curInstallAppIndex, 1);

    try {
      fse.removeSync(path.join(APPS_BASE_FOLDER, namespace));
      fs.writeFileSync(path.join(process.cwd(), './application.json'), JSON.stringify(applications, undefined, 2));
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_UNINSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'success' }) });
    } catch (e) {
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_UNINSTALL_LOG, userId, logContent: JSON.stringify({ ...logInfo, status: 'error' }) });
      fs.writeFileSync(path.join(process.cwd(), './application.json'), JSON.stringify(originApplications, undefined, 2));

      Logger.info(logPrefix + e.message);
      Logger.info(logPrefix + e?.stack?.toString())
    }

    try {
      Logger.info(logPrefix + "卸载应用，即将重启服务");
      childProcess.exec(
        `npx pm2 reload ${getAppThreadName()}`,
        { cwd: path.join(process.cwd()) },
        (error, stdout, stderr) => {
          if (error) {
            Logger.info(logPrefix + `exec error: ${error}`);
            return;
          }
          Logger.info(logPrefix + `stdout: ${stdout}`);
          Logger.info(logPrefix + `stderr: ${stderr}`);
        }
      );

    } catch (e) {
      Logger.info(logPrefix + e.message);
      Logger.info(logPrefix + e?.stack?.toString())
    }

    if(systemConfig?.system?.config?.openConflictDetection) {
      Logger.info(logPrefix + "解锁成功，可继续处理系统任务");
      // 解锁
      await unLockUpgrade({ force: true })
    }

    return { code: 1, data: null, message: '卸载成功' };
  }

  updateLocalAppVersion({ namespace, version, installType }) {
    const application = require(path.join(process.cwd(), './application.json'));
    let installApp = null
    application?.installApps?.forEach(app => {
      if(app.namespace === namespace || (app.type === 'npm' && app.path?.startsWith(`${namespace}@`))) {
        app.version = version;
        app.namespace = namespace;
        app.type = installType;
        installApp = app
      }
    })
    if(!installApp) {
      application?.installApps.push({
        namespace,
        version,
        type: installType
      })
    }
    fs.writeFileSync(path.join(process.cwd(), './application.json'), JSON.stringify(application, undefined, 2))
  }

  @Post("/offlineUpdate")
  @UseInterceptors(FileInterceptor('file'))
  async appOfflineUpdate(@Req() req, @Body() body, @UploadedFile() file) {
    const systemConfig = await this.configService.getConfigByScope(['system'])
    try {
      if(systemConfig?.system?.config?.openConflictDetection) {
        Logger.info('[offlineUpdate]: 开启了冲突检测')
        await lockUpgrade()
      }
    } catch(e) {
      Logger.info(e)
      Logger.info(e?.stack?.toString())
      return {
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      }
    }
    const tempFolder = path.join(process.cwd(), '../_tempapp_')
    try {
      if(!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder)
      }
      const zipFilePath = path.join(tempFolder, `./${file.originalname}`)
      Logger.info('[offlineUpdate]: 开始持久化压缩包')
      fs.writeFileSync(zipFilePath, file.buffer);
      childProcess.execSync(`which unzip`).toString()
      Logger.info('[offlineUpdate]:开始解压文件')
      childProcess.execSync(`unzip -o ${zipFilePath} -d ${tempFolder}`, {
        stdio: 'inherit' // 不inherit输出会导致 error: [Circular *1]
      })
      console.log('进来了')
      const subFolders = fs.readdirSync(tempFolder)
      let unzipFolderSubpath = ''
      Logger.info(`[offlineUpdate]: subFolders: ${JSON.stringify(subFolders)}}`)
      for(let name of subFolders) {
        if(name.indexOf('.') === -1) {
          unzipFolderSubpath = name
          break
        }
      }
      const unzipFolderPath = path.join(tempFolder, unzipFolderSubpath)
      const pkg = require(path.join(unzipFolderPath, './package.json'))
      Logger.info(`[offlineUpdate]: pkg: ${JSON.stringify(pkg)}`)
      // inject something
      const fePath = path.join(unzipFolderPath, './assets')
      if(fs.existsSync(fePath)) {
        const feDirs = fs.readdirSync(fePath)
        feDirs?.forEach(name => {
          if(name.indexOf('.html') !== -1 && name !== 'preview.html' && name !== 'publish.html') {
            // 默认注入所有的资源
            Logger.info('[offlineUpdate]: assets: 开始注入')
            const srcHomePage = path.join(fePath, name)
            const rawHomePageStr = fs.readFileSync(srcHomePage, 'utf-8')
            let handledHomePageDom = parse5.parse(rawHomePageStr);
            travelDom(handledHomePageDom, {
              ajaxScriptStr: injectAjaxScript({
                namespace: pkg.name ? pkg.name : ''
              }),
              appConfigScriptStr: injectAppConfigScript({
                namespace: pkg.name ? pkg.name : '',
                version: pkg?.version,
                ...(pkg?.mybricks || {})
              }),
              rawHtmlStr: rawHomePageStr,
            })
            let handledHomePageStr = parse5.serialize(handledHomePageDom)
            fs.writeFileSync(srcHomePage, handledHomePageStr, 'utf-8')  
            Logger.info('[offlineUpdate]: assets: 注入成功')
          }
        })
      }
      let appName = pkg.name;
      // 包含scope，需要编码
      if(pkg.name.indexOf('@') !== -1) {
        // 需要加密
        appName = encodeURIComponent(pkg.name)
      }
      const destAppDir = path.join(env.getAppInstallFolder())
      Logger.info('[offlineUpdate]: 开始复制文件')
      // fse.copySync(unzipFolderPath, destAppDir)
      // 删除历史版本
      if(fse.existsSync(path.join(destAppDir, pkg.name, './assets'))) {
        Logger.info('[offlineUpdate]: 清除存量应用前端资源')
        fse.removeSync(path.join(destAppDir, pkg.name, './assets'))
      }
      if(fs.existsSync(path.join(destAppDir, pkg.name, './nodejs'))) {
        Logger.info('[offlineUpdate]: 清除存量应用后端资源')
        fse.removeSync(path.join(destAppDir, pkg.name, './nodejs'))
      }
      childProcess.execSync(`cp -rf ${unzipFolderPath} ${destAppDir}`)
      // copy xml
      const bePath = path.join(unzipFolderPath, './nodejs')
      if(fs.existsSync(bePath)) {
        if(fs.existsSync(path.join(bePath, './mapper'))) {
          Logger.info('[offlineUpdate]: 开始复制mapper')
          fse.copySync(path.join(bePath, './mapper'), path.join(process.cwd(), `./src/resource`))
        }
      }
      Logger.info('[offlineUpdate]: 开始清除临时文件')
      fse.removeSync(tempFolder)
      Logger.info('[offlineUpdate]: 版本信息开始持久化到本地')
      // 更新本地版本
      this.updateLocalAppVersion({ namespace: pkg.name, version: pkg.version, installType: 'local' })

      Logger.info('[offlineUpdate]: 平台更新成功，准备写入操作日志')
      await this.userLogDao.insertLog({ type: USER_LOG_TYPE.APPS_INSTALL_LOG, userId: req?.query?.userId,
        logContent: JSON.stringify(
          {
            action: 'install',
            type: 'application',
            installType: 'local',
            namespace: pkg.name || '未知namespace',
            name: pkg?.mybricks?.title || '未知title',
            content: `更新应用：${pkg?.mybricks?.title}，离线安装成功，服务已更新`,
          }
        )
      });

      Logger.info('[offlineUpdate]: 开始重启服务')
      // 重启服务
      childProcess.exec(
        `npx pm2 reload ${getAppThreadName()}`,
        {
          cwd: path.join(process.cwd()),
        },
        (error, stdout, stderr) => {
          if (error) {
            Logger.info(`[offlineUpdate]: exec error: ${error}`);
            return;
          }
          Logger.info(`[offlineUpdate]: stdout: ${stdout}`);
          Logger.info(`[offlineUpdate]: stderr: ${stderr}`);
        }
      );
    } catch(e) {
      Logger.info('[offlineUpdate]: 错误信息是')
      Logger.info(`[offlineUpdate]: ${e.message}`)
      Logger.info(`[offlineUpdate]: ${e?.stack?.toString()}`)
      fse.removeSync(tempFolder)
    }
    
    if(systemConfig?.system?.config?.openConflictDetection) {
      Logger.info("[offlineUpdate]: 解锁成功，可继续升级应用");
      // 解锁
      await unLockUpgrade({ force: true })
    }
    return { code: 1, message: "安装成功" };
  }

  @Get("/update/status")
  async checkAppUpdateStatus(
    @Query("namespace") namespace: string,
    @Query("version") version: string,
    @Query("action") action: string
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
      if (app || (action === 'uninstall' && !app)) {
        return { code: 1, message: '重启成功' };
      }
    } catch (e) {
      Logger.info("安装应用失败");
      Logger.info(e.message);
      Logger.info(e?.stack?.toString())
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
      !version
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
    if(user_id) {
      await this.userLogDao.insertLog({
        type: USER_LOG_TYPE.APPS_INSTALL_LOG,
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
    }
    
    return {
      code: 1,
      msg: "发布成功",
    };
  }
}
