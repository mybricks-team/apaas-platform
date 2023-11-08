import ServicePubDao from './../../dao/ServicePubDao';
import {Body, Controller, Get, Param, Post, Query, Req, 
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import FileDao from '../../dao/FileDao';
import FilePubDao from '../../dao/filePub.dao';
import AppDao from '../../dao/AppDao';
import { getOSInfo, getPlatformFingerPrint, uuid } from '../../utils/index';
import { getConnection } from '@mybricks/rocker-dao';
import { Logger } from '@mybricks/rocker-commons';
// @ts-ignore
import { createVM } from 'vm-node';
import FileService from '../file/file.controller'
import * as axios from "axios";
import platformEnvUtils from '../../utils/env'
import UserLogDao from "../../dao/UserLogDao";
import SessionService from './session.service';
import { STATUS_CODE } from '../../constants'
import { lockUpgrade, unLockUpgrade } from '../../utils/lock';
import ConfigService from '../config/config.service';
import TransformSuccessCodeInterceptor from '../../middleware/transformSuccessCode.interceptor'

const childProcess = require('child_process');
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra');
const { getAppThreadName } = require('../../../env')

@Controller('/paas/api')
export default class SystemService {
  fileDao: FileDao;

  filePubDao: FilePubDao;

  servicePubDao: ServicePubDao

  appDao: AppDao;

  fileService: FileService
  userLogDao: UserLogDao;

  conn: any;

  nodeVMIns: any;

  sessionService: SessionService;
  configService: ConfigService;

  constructor() {
    this.fileDao = new FileDao();
    this.filePubDao = new FilePubDao();
    this.servicePubDao = new ServicePubDao();
    this.appDao = new AppDao()
    this.userLogDao = new UserLogDao()
    this.conn = null;
    this.nodeVMIns = createVM({ openLog: true });
    this.fileService = new FileService()
    this.sessionService = new SessionService()
    this.configService = new ConfigService();
  }

  checkSqlValid(sql) {
    let blackOpList = ['create ', 'alter ', 'drop ', 'truncate ', 'show '];
    let lowerStr = sql.toLowerCase();
    let result = true;
    blackOpList.forEach((blackOp) => {
      if (lowerStr.indexOf(blackOp) !== -1) {
        result = false;
      }
    });
    return result;
  }

  async _execSQL(sql: string, args?: any) {
    if (!this.conn) {
      this.conn = await getConnection();
    }
    const conn = this.conn;
    const handledSql = sql?.replace(
      new RegExp('(?:\n|\t|\r)', 'ig'),
      ($0, $1) => {
        return ' ';
      },
    );
    let param = {
      sql: handledSql,
      timeout: 10 * 1000,
    };
    if (args) {
      param['values'] = args;
    }
    return new Promise((resolve, reject) => {
      let tdId = conn.threadId;
      conn.beginTransaction(function (_e) {
        if (_e) {
          Logger.info(`[${tdId}]: Transaction failed`);
          reject(_e);
        }
        Logger.info(`[${tdId}]: Transaction start`);
        try {
          conn
            .query(param, args, function (error, results, fields) {
              if (error) {
                Logger.info('执行业务SQL失败：', error);
                conn.rollback(function () {
                  Logger.info(`[${tdId}]: Transaction rollback`);
                });
                reject(error);
              }
              conn.commit(function (err) {
                if (err) {
                  Logger.info(err);
                  conn.rollback(function () {
                    Logger.info(`[${tdId}]: Transaction rollback`);
                  });
                  reject(err);
                }
              });
              Logger.info(`[${tdId}]: Transaction succeed`);
              resolve(results);
            })
            .once('end', () => {
              Logger.info(
                `[${tdId}]: Transaction Query End: Connection Released`,
              );
              conn.release();
            });
        } catch (e) {
          Logger.info(
            `[${tdId}]: Transaction Query Failed: Connection Released`,
          );
          conn.release();
          reject(e);
        }
      });
    });
  }

  @Post('/system/domain/list')
  async getDomainServiceList(@Body('fileId') fileId: number) {
    try {
      const currentFileHierarchy = await this.fileService._getParentModuleAndProjectInfo(fileId)
      let totalList = [];
      let domainFiles = await this.fileDao.pureQuery({
        extName: 'domain',
      });
      let filterDomainFiles = []
      const allDomainFileHierarchyTask = []
      domainFiles.forEach(i => {
        allDomainFileHierarchyTask.push(this.fileService._getParentModuleAndProjectInfo(i.id))
      })
      let allDomainFileHierarchy = await Promise.all(allDomainFileHierarchyTask);

      if (currentFileHierarchy.projectId) {
        // 项目内，必须是同一项目
        domainFiles?.forEach((i, index) => {
          if(allDomainFileHierarchy[index]?.projectId === currentFileHierarchy.projectId) {
            filterDomainFiles.push(i)
          }
        })
      } else {
        // 非项目内，找到projectID为空的列表
        domainFiles?.forEach((i, index) => {
          if(!allDomainFileHierarchy[index]?.projectId) {
            filterDomainFiles.push(i)
          }
        })
      }
      const fileInfoMap = {};
      filterDomainFiles?.map((f) => {
        fileInfoMap[f.id] = f;
      });
      const fileIds: any[] = Object.keys(fileInfoMap) || [];
      let pubContentList = [];
      if(fileIds?.length !== 0) {
        pubContentList =  await this.filePubDao.getLatestPubByIds({
          ids: fileIds,
          envType: 'prod',
        });
      }

      pubContentList?.forEach((pubContent) => {
        const contentObj =
          typeof pubContent.content === 'string'
            ? JSON.parse(pubContent.content)
            : pubContent.content;
        //  过滤服务
        if (contentObj?.serviceAry?.length > 0) {
          let service = {
            fileId: pubContent.fileId,
            fileName: fileInfoMap[pubContent.fileId]?.name,
            serviceList: [],
          };
          contentObj?.serviceAry?.forEach((s) => {
            service.serviceList.push({
              serviceId: s.id,
              title: s.title,
              paramAry: s.paramAry,
            });
          });
          totalList.push(service);
        }
      });
      return {
        code: 1,
        data: totalList,
      };
    } catch (e) {
      Logger.info(e);
      return {
        code: -1,
        data: [],
        msg: `获取接口列表失败: ${e.message}`,
      };
    }
  }
	
	
  @Post('/system/domain/entity/list')
  async getDomainEntityList(@Body('fileId') fileId: number) {
		try {
			const currentFileHierarchy = await this.fileService._getParentModuleAndProjectInfo(fileId)
			let totalList = [];
			let domainFiles = await this.fileDao.pureQuery({
				extName: 'domain',
			});
			let filterDomainFiles = []
			const allDomainFileHierarchyTask = []
			domainFiles.forEach(i => {
				allDomainFileHierarchyTask.push(this.fileService._getParentModuleAndProjectInfo(i.id))
			})
			let allDomainFileHierarchy = await Promise.all(allDomainFileHierarchyTask);
			
			if (currentFileHierarchy.projectId) {
				// 项目内，必须是同一项目
				domainFiles?.forEach((i, index) => {
					if(allDomainFileHierarchy[index]?.projectId === currentFileHierarchy.projectId) {
						filterDomainFiles.push(i)
					}
				})
			} else {
				// 非项目内，找到projectID为空的列表
				domainFiles?.forEach((i, index) => {
					if(!allDomainFileHierarchy[index]?.projectId) {
						filterDomainFiles.push(i)
					}
				})
			}
			const fileInfoMap = {};
			filterDomainFiles?.map((f) => {
				fileInfoMap[f.id] = f;
			});
			const fileIds: any[] = Object.keys(fileInfoMap) || [];
			let pubContentList = [];
			if(fileIds?.length !== 0) {
				pubContentList =  await this.filePubDao.getLatestPubByIds({
					ids: fileIds,
					envType: 'test',
				});
			}
			
			pubContentList?.forEach((pubContent) => {
				const contentObj =
					typeof pubContent.content === 'string'
						? JSON.parse(pubContent.content)
						: pubContent.content;
				
				//  过滤服务
				if (contentObj?.entityAry?.length > 0) {
					totalList.push({
						fileId: pubContent.fileId,
						fileName: fileInfoMap[pubContent.fileId]?.name,
						entityList: contentObj?.entityAry,
					});
				}
			});
			return {
				code: 1,
				data: totalList,
			};
		} catch (e) {
			return {
				code: -1,
				data: [],
				msg: `获取模型列表失败: ${e.message}`,
			};
		}
	}

  async _execServicePub(pubInfo, {
    params,
    serviceId,
    fileId,
    headers,
    userId
  }) {
    try {
      if(!pubInfo) {
        return {
          code: -1,
          msg: `未找到 ${fileId} 下的服务 ${serviceId}, 请确认！`,
        };
      }
      const codeStr = decodeURIComponent(pubInfo?.content);
      let res:any = {};
      try {
        const { success, data, msg, logStack } = await this.nodeVMIns.run(codeStr, 
          {
            injectParam: { 
              ...params, 
              _options: {
                _headers: headers,
                userId
              }, 
            collectLog: params?.showToplLog || false 
          }
        });

        if (success) {
          Logger.info('data', data)
          res = data?._CUSTOM_ ? data.data : {
            code: 1,
            data,
            msg,
          };
        } else {
          res = {
            code: -1,
            data,
            msg,
          };
        }
        if(params?.showToplLog) {
          // @ts-ignore
          res.logStack = logStack
        }
      } catch (e) {
        Logger.info(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`);
        res = {
          code: -1,
          msg: e.data,
          logStack: e.logStack
        }
      }
      return res;
    } catch (e) {

    }
  }

  async _execDomainRun(req, response, { serviceId, fileId, params, projectId }) {
    let sessionRes: any = {};
    // 如果是项目下，需要检测登录态，否则不需要
    if(serviceId !== 'login' && serviceId !== 'register') {
      sessionRes = await this.sessionService.checkUserSession({ fileId, projectId }, req);
    }
    if(sessionRes?.code === STATUS_CODE.LOGIN_OUT_OF_DATE) {
      return sessionRes
    }
    if (!serviceId || !fileId) {
      return {
        code: -1,
        msg: '缺少 serviceId 或 fileId',
      };
    }
    const { userId } = sessionRes;

    const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
      fileId,
      env: 'prod',
      serviceId,
    })
    const res = await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params,
      userId,
      headers: req.headers
    })
    if(( serviceId === 'login' || serviceId === 'register' ) && res?.data?.凭证) {
      // 因为存量接口所有这里兼容，种两种cookie
      response.cookie('token', res?.data?.凭证, {
        path: '/paas/api/system',
        httpOnly: true,
        maxAge: 1000 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: 'Lax'
      })
      response.cookie('token', res?.data?.凭证, {
        path: '/api/system',
        httpOnly: true,
        maxAge: 1000 * 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: 'Lax'
      })
      delete res?.data?.凭证
    }

    return res;
  }

  // 领域建模运行时
  @Post('/system/domain/run')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRun(
    // 通用参数
    @Body('serviceId') serviceId: string,
    @Body('params') params: any,
    @Body('fileId') fileId: number,
    @Body('projectId') projectId: number,
    @Req() req: any,
    @Res({ passthrough: true }) response: Response
  ) {
    return await this._execDomainRun(req, response, { fileId, params, serviceId, projectId });
  }

  // 领域建模运行时
  @Post('/system/domain/run/:fileId/:serviceId')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Post(
    @Body() params: any,
    @Body('projectId') projectId: number,
    @Query() query: any,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return await this._execDomainRun(req, response, {
      fileId,
      params: { ...(query || {}), ...(params || {}) },
      serviceId,
      projectId
    });
  }

  // 领域建模运行时
  @Get('/system/domain/run/:fileId/:serviceId')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Get(
    @Query() params: any,
    @Query('projectId') projectId: number,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return await this._execDomainRun(req, response, { fileId, params, serviceId, projectId });
  }

  // 领域建模运行时
  @Post('/system/domain/run/:fileId/:serviceId/:action')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Action_Post(
    @Body() params: any,
    @Body('projectId') projectId: number,
    @Query() query: any,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('action') action: string,
    @Param('serviceId') serviceId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    return await this._execDomainRun(req, response, {
      fileId,
      params: { ...(query || {}), ...(params || {}), action },
      serviceId,
      projectId
    });
  }

  // 领域建模运行时
  @Get('/system/domain/run/:fileId/:serviceId/:action')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Action_Get(
      @Query() params: any,
      @Req() req: any,
      @Query('projectId') projectId: number,
      @Param('fileId') fileId: number,
      @Param('serviceId') serviceId: string,
      @Param('action') action: string,
      @Res({ passthrough: true }) response: Response
  ) {
    return await this._execDomainRun(req, response, {
      fileId,
      params: { ...(params || {}), action },
      serviceId,
      projectId
    });
  }

  @Post('/system/domain/execSql')
  async execSql(
    @Body('sql') sql: string,
    @Body('params') params: any[],
    @Body('pwd') pwd: string,
  ) {
    if (!sql || !pwd || pwd !== 'fangzhouapaas') {
      return {
        code: -1,
        msg: 'sql字段不能为空',
      };
    }
    let execRes = {};
    try {
      execRes = await this._execSQL(sql, params ?? []);
      return {
        code: 1,
        data: execRes,
        msg: '',
      };
    } catch (e) {
      Logger.info(`[/system/domain/execSql]: 出错 ${JSON.stringify(e)}`);
      return {
        code: -1,
        msg: JSON.stringify(e),
      };
    }
  }

  @Post('/system/checkUpdateFromNpm')
  async checkUpdateFromNpm() {
    const version = await childProcess.execSync('npm view mybricks-apaas-platform version').toString().replace('\n', '')
    if(version) {
      return {
        code: 1,
        data: {
          version
        },
      };
    } else {
      return {
        code: -1,
        msg: '获取最新版本失败'
      }
    }
  }

  async _sendReport(content: string) {
    const res = (await (axios as any).post(
      `https://my.mybricks.world/central/api/channel/gateway`, 
      // `http://localhost:4100/central/api/channel/gateway`, 
      {
      action: "log_report",
      payload: content
    }).data)

    return res
  }

  @Post('/system/channel')
  async channel(@Body() body: any) {
    const { type, version, isAdministrator, payload, userId } = body;
    const systemConfig = await this.configService.getConfigByScope(['system'])
    if(platformEnvUtils.isPlatform_Fangzhou()) {
      return {
        code: -1,
        msg: '该平台暂不支持此功能'
      }
    }
    if(systemConfig?.system?.config?.isPureIntranet) {
      return {
        code: -1,
        msg: '纯内网部署，暂不支持此功能'
      }
    }
    try {
      switch (type) {
        case 'checkLatestPlatformVersion': {
          const appJSON = fs.readFileSync(path.join(__dirname, '../../../application.json'), 'utf-8')
          const { platformVersion } = JSON.parse(appJSON)
          const res = (await (axios as any).post(
            'https://my.mybricks.world/central/api/channel/gateway', 
            // 'http://localhost:4100/central/api/channel/gateway', 
            {
              action: 'platform_checkLatestVersion',
              payload: JSON.stringify({ version: platformVersion })
            })).data
          if(res.code === 1) {
            return {
              code: 1,
              data: { version: res.data.version, previousList: res.data.previousList }
            }
          } else {
            return res
          }
        }
        case 'getCurrentPlatformVersion': {
          try {
            const appJSON = fs.readFileSync(path.join(__dirname, '../../../application.json'), 'utf-8')
            const { platformVersion } = JSON.parse(appJSON)
            return {
              code: 1,
              data: platformVersion
            }
          } catch (e) {
            Logger.info(e)
            return {
              code: -1,
              msg: e.message
            }
          }
        }
        case 'downloadPlatform': {
          const systemConfig = await this.configService.getConfigByScope(['system'])
          try {
            if(systemConfig?.system?.config?.openConflictDetection) {
              Logger.info('开启了冲突检测')
              await lockUpgrade()
            }
          } catch(e) {
            Logger.info(e)
            return {
              code: -1,
              msg: '当前已有升级任务，请稍后重试'
            }
          }
          const appJSON = fs.readFileSync(path.join(__dirname, '../../../application.json'), 'utf-8')
          const { platformVersion: prePlatformVersion } = JSON.parse(appJSON)
          const res = (await (axios as any).post(
            `https://my.mybricks.world/central/api/channel/gateway`, 
            // `http://localhost:4100/central/api/channel/gateway`, 
            {
            action: "platform_downloadByVersion",
            payload: JSON.stringify({ version })
          })).data
          if(res.code === 1) {
            if(!fs.existsSync(path.join(process.cwd(), '../_temp_'))) {
              fs.mkdirSync(path.join(process.cwd(), '../_temp_'))
            }
            fs.writeFileSync(path.join(process.cwd(), '../_temp_/mybricks-apaas.zip'), Buffer.from(res.data.data));
            
            const shellPath = path.join(process.cwd(), '../upgrade_platform.sh')
            Logger.info(shellPath)
            const log = await childProcess.execSync(`bash ${shellPath} ${version}`, {
              cwd: path.join(process.cwd(), '../'),
              stdio: 'inherit'
            });
            Logger.info('平台更新成功，准备写入操作日志')
            await this.userLogDao.insertLog({
              type: 10,
              userId,
              logContent: JSON.stringify({
                type: 'platform',
                action: 'install',
                installType: 'oss',
                preVersion: prePlatformVersion,
                version,
                content: `更新平台，版本从 ${prePlatformVersion} 到 ${version}, 服务已更新`,
              })
            });
            if(systemConfig?.system?.config?.openConflictDetection) {
              Logger.info("解锁成功，可继续升级应用");
              // 解锁
              await unLockUpgrade({ force: true })
            }
            return {
              code: 1,
              msg: log?.toString() || '升级成功'
            }
          } else {
            if(systemConfig?.system?.config?.openConflictDetection) {
              Logger.info("解锁成功，可继续升级应用");
              // 解锁
              await unLockUpgrade({ force: true })
            }
            return {
              code: -1,
              msg: '下载失败，请重试'
            }
          }
        }
        case 'reloadPlatform': {
          try {
            const appJSONStr = fs.readFileSync(path.join(__dirname, '../../../application.json'), 'utf-8')
            let appJSON = JSON.parse(appJSONStr)
            appJSON.platformVersion = version
            fs.writeFileSync(path.join(__dirname, '../../../application.json'), JSON.stringify(appJSON, null, 2))
            childProcess.exec(`npx pm2 reload all`)
            return {
              code: 1,
            };
          } catch(e) {
            return {
              code: -1,
              msg: e.message || '升级失败'
            }
          }
        }
        case 'getLatestNoticeList': {
          const res = (await (axios as any).post(
            `https://my.mybricks.world/central/api/channel/gateway`, 
            // `http://localhost:4100/central/api/channel/gateway`, 
            {
            action: "notice_latestList",
            payload: JSON.stringify({ isAdministrator })
          })).data
          return res
        }
        case 'connect': {
          // 每次进来初始化，上报一次数据
          const info = require(path.join(__dirname, '../../../application.json'))
          await this._sendReport(JSON.stringify({
            uuid: getPlatformFingerPrint(),
            namespace: 'platform',
            content: {
              ...info,
              platformInfo: getOSInfo() 
            }
          }))
          return {
            code: 1,
            msg: 'succeed' 
          }
        }
        case 'report': {
          const res = await this._sendReport(JSON.stringify({
            uuid: getPlatformFingerPrint(),
            namespace: payload.namespace,
            content: payload
          }))
          return res
        }
      }
      return {
        code: -1,
        msg: '未知指令'
      }
    } catch(err) {
      Logger.info(err)
      return {
        code: -1,
        msg: `[${type}]:` + err.message
      }
    }
  }

  updateLocalPlatformVersion({ version }) {
    const application = require(path.join(process.cwd(), './application.json'));
    application.platformVersion = version;
    fs.writeFileSync(path.join(process.cwd(), './application.json'), JSON.stringify(application, undefined, 2))
  }

  @Post("/system/offlineUpdate")
  @UseInterceptors(FileInterceptor('file'))
  async systemOfflineUpdate(@Req() req, @Body() body, @UploadedFile() file) {
    const systemConfig = await this.configService.getConfigByScope(['system'])
    try {
      if(systemConfig?.system?.config?.openConflictDetection) {
        Logger.info('开启了冲突检测')
        await lockUpgrade()
      }
    } catch(e) {
      Logger.info(e)
      return {
        code: -1,
        msg: '当前已有升级任务，请稍后重试'
      }
    }
    const tempFolder = path.join(process.cwd(), '../_temp_')
    try {
      if(!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder)
      }
      const zipFilePath = path.join(tempFolder, `./${file.originalname}`)
      Logger.info('开始持久化压缩包')
      fs.writeFileSync(zipFilePath, file.buffer);
      childProcess.execSync(`which unzip`).toString()
      Logger.info('开始解压文件')
      childProcess.execSync(`unzip -o ${zipFilePath} -d ${tempFolder}`, {
        stdio: 'inherit' // 不inherit输出会导致 error: [Circular *1]
      })
      Logger.info(`解压文件成功, 目录是: ${JSON.stringify(fs.readdirSync(tempFolder))}`)
      const subFolders = fs.readdirSync(tempFolder)
      let unzipFolderSubpath = ''
      Logger.info(`subFolders: ${JSON.stringify(subFolders)}}`)
      for(let name of subFolders) {
        if(name.indexOf('.') === -1) {
          unzipFolderSubpath = name
          break
        }
      }
      const unzipFolderPath = path.join(tempFolder, unzipFolderSubpath)
      const pkg = require(path.join(unzipFolderPath, './server/package.json'))
      Logger.info(`pkg: ${JSON.stringify(pkg)}`)
      Logger.info(`开始复制文件: 从${path.join(unzipFolderPath, './')} 到 ${path.join(process.cwd(), '../')}`)
      childProcess.execSync(`cp -rf ${path.join(unzipFolderPath, './server')} ${path.join(process.cwd(), '../')}`)
      childProcess.execSync(`cp -rf ${path.join(unzipFolderPath, './server-runtime')} ${path.join(process.cwd(), '../')}`)
      childProcess.execSync(`cp -rf ${path.join(unzipFolderPath, './upgrade_platform.sh')} ${path.join(process.cwd(), '../')}`)
      // childProcess.execSync(`cp -rf ${path.join(unzipFolderPath, './server-runtime')} ${path.join(process.cwd(), '../')}`)
      Logger.info('开始清除临时文件')
      fse.removeSync(tempFolder)
      Logger.info('版本信息开始持久化到本地')
      // 更新本地版本
      this.updateLocalPlatformVersion({ version: pkg.version })

      Logger.info('平台更新成功，准备写入操作日志')
      await this.userLogDao.insertLog({
        type: 10,
        userId: req?.query?.userId,
        logContent: JSON.stringify({
          type: 'platform',
          action: 'install',
          installType: 'local',
          content: `离线更新平台更新平台, 服务已更新`,
        })
      });

      Logger.info('开始重启服务')
      // 重启服务
      childProcess.exec(
        `npx pm2 reload ${getAppThreadName()}`,
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
    } catch(e) {
      Logger.info('错误信息是')
      Logger.info(e.message)
      fse.removeSync(tempFolder)
    }
    
    if(systemConfig?.system?.config?.openConflictDetection) {
      Logger.info("解锁成功，可继续升级应用");
      // 解锁
      await unLockUpgrade({ force: true })
    }
    return { code: 1, message: "安装成功" };
  }

  @Post('/system/reloadAll')
  async reloadAll() {
    childProcess.exec(`npx pm2 reload all`)
    return {
      code: 1,
    };
  }

  @Post('/system/diagnostics')
  async diagnostics(@Body('action') action, @Body('payload') payload) {
    try {
      switch(action) {
        case 'init': {
          return {
            code: 1,
            msg: 'success'
          }
        }
        case 'envCheck': {
          let msg = '';
          if(global?.MYBRICKS_PLATFORM_START_ERROR) {
            msg += global.MYBRICKS_PLATFORM_START_ERROR
          }
          await childProcess.execSync('unzip').toString()
          // const reqUrl = `http://localhost:3100/paas/api/system/diagnostics`
          const reqUrl = process.env.MYBRICKS_PLATFORM_ADDRESS?.endsWith('/') ?  `${process.env.MYBRICKS_PLATFORM_ADDRESS}paas/api/system/diagnostics` : `${process.env.MYBRICKS_PLATFORM_ADDRESS}/paas/api/system/diagnostics`;
          Logger.info(`诊断服务请求日志：${reqUrl}`)
          // @ts-ignore
          await axios.post(reqUrl, { action: "init"})
          msg += `\n 接口请求域名是：${process.env.MYBRICKS_PLATFORM_ADDRESS}`
          
          return {
            code: 1,
            msg
          }
        }
      }
    } catch(e) {
      Logger.info(`诊断服务出错：${e.message}`)
      return {
        code: -1,
        msg: (e.message || '未知错误') + `\n后台服务请求域名是: ${process.env.MYBRICKS_PLATFORM_ADDRESS}`
      }
    }
  }
}
