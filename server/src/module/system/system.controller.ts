import ServicePubDao from './../../dao/ServicePubDao';
import {Body, Controller, Get, Param, Post, Query, Req} from '@nestjs/common';
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
import RefreshDao from "../../dao/RefreshDao";
import UserLogDao from "../../dao/UserLogDao";

const childProcess = require('child_process');
const path = require('path')
const fs = require('fs')
const env = require('../../../env')

@Controller('/paas/api')
export default class SystemService {
  fileDao: FileDao;

  filePubDao: FilePubDao;

  servicePubDao: ServicePubDao

  appDao: AppDao;
  refreshDao: RefreshDao;

  fileService: FileService
  userLogDao: UserLogDao;

  conn: any;

  nodeVMIns: any;

  constructor() {
    this.fileDao = new FileDao();
    this.filePubDao = new FilePubDao();
    this.servicePubDao = new ServicePubDao();
    this.appDao = new AppDao()
    this.refreshDao = new RefreshDao()
    this.userLogDao = new UserLogDao()
    this.conn = null;
    this.nodeVMIns = createVM({ openLog: true });
    this.fileService = new FileService()
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

  // 流水线应用运行时：用于页面发布流程定制
  @Post('/system/task/run')
  async systemTaskRun(
    @Body('fileId') fileId: string,
    @Body('version') version: string,
    @Body('injectParam') injectParam: any,
  ) {
    const pubInfo = await this.filePubDao.getPublishByFileIdAndVersion({
      fileId,
      version,
    });
    // @ts-ignore
    const codeStr = pubInfo.content;
    const workFlowInfo = {
      fileId,
      pubVersion: version,
    };
    const str = `;const WORK_FLOW_INFO = ${JSON.stringify(workFlowInfo)};`+ codeStr;
    let res = {
      code: 1,
      data: null,
      msg: '',
    };
    try {
      const { success, data, msg } = await this.nodeVMIns.run(str, {
        injectParam: injectParam
      });
      res = {
        code: success ? 1 : -1,
        data,
        msg,
      };
    } catch (e) {
      Logger.info(`[/system/task/run]: 出错 ${JSON.stringify(e)}`);
      res.code = -1;
      res.msg = JSON.stringify(e.msg);
    }
    return res;
  }

  // 接口搭建workflow使用
  @Post('/system/workflow/run')
  async systemWorkflowRun(
    @Body('fileId') fileId: string,
    @Body('version') version: string,
    @Body('params') params: any,
  ) {
    if (!fileId) {
      return {
        code: -1,
        msg: '缺少 fileId',
      };
    }
    let pubInfo = null;
    if (!version) {
      pubInfo = (
        await this.filePubDao.getLatestPubByFileId(+fileId, 'prod')
      )[0];
    } else {
      pubInfo = await this.filePubDao.getPublishByFileIdAndVersion({
        fileId,
        version,
      });
    }

    // @ts-ignore
    const codeStr = pubInfo.content;
    const str = codeStr;
    let res = {
      code: 1,
      data: null,
      msg: '',
    };
    try {
      const { success, data, msg } = await this.nodeVMIns.run(str, {
        injectParam: params
      });
      res = {
        code: success ? 1 : -1,
        data,
        msg,
      };
    } catch (e) {
      Logger.info(`[/system/workflow/run]: 出错 ${JSON.stringify(e)}`);
      res.code = -1;
      res.msg = JSON.stringify(e.msg);
    }
    return res;
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
    headers
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
        const { success, data, msg, logStack } = await this.nodeVMIns.run(codeStr, {
          injectParam: { ...params, _options: {
            _headers: headers,
          }, collectLog: params?.showToplLog || false }
        });
        res = {
          code: success ? 1 : -1,
          data,
          msg,
        };
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

  // 领域建模运行时
  @Post('/system/domain/run')
  async systemDomainRun(
    // 通用参数
    @Body('serviceId') serviceId: string,
    @Body('params') params: any,
    @Body('fileId') fileId: number,
    @Req() req: any
  ) {
    if (!serviceId || !fileId) {
      return {
        code: -1,
        msg: '缺少 serviceId 或 fileId',
      };
    }

    const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
      fileId,
      env: 'prod',
      serviceId,
    })
    const res = await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params,
      headers: req.headers
    })
    return res
  }

  // 领域建模运行时
  @Post('/system/domain/run/:fileId/:serviceId')
  async systemDomainRunById_Post(
    // 通用参数
    @Body() params: any,
    @Query() query: any,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
  ) {
    const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
      fileId,
      env: 'prod',
      serviceId,
    })
    return await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params: { ...(query || {}), ...(params || {}) },
      headers: req.headers
    })
  }

  // 领域建模运行时
  @Get('/system/domain/run/:fileId/:serviceId')
  async systemDomainRunById_Get(
    // 通用参数
    @Query() params: any,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
  ) {
    const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
      fileId,
      env: 'prod',
      serviceId,
    })
    return await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params,
      headers: req.headers
    })
  }

  // 领域建模运行时
  @Post('/system/domain/run/:fileId/:serviceId/:action')
  async systemDomainRunById_Action_Post(
    // 通用参数
    @Body() params: any,
    @Query() query: any,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('action') action: string,
    @Param('serviceId') serviceId: string,
  ) {
    const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
      fileId,
      env: 'prod',
      serviceId,
    });

    return await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params: { ...(query || {}), ...(params || {}), action },
      headers: req.headers
    })
  }

  // 领域建模运行时
  @Get('/system/domain/run/:fileId/:serviceId/:action')
  async systemDomainRunById_Action_Get(
    // 通用参数
    @Query() params: any,
    @Req() req: any,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Param('action') action: string,
  ) {
    const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
      fileId,
      env: 'prod',
      serviceId,
    });

    return await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params: { ...(params || {}), action },
      headers: req.headers
    })
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

  @Post('/system/sandbox/testRun')
  async testRun(@Body('code') code: string, @Body('params') params: any) {
    if (!code) {
      return {
        code: -1,
        msg: '缺少 code',
      };
    }
    const taskId = uuid(10);
    const str = `
      ;const _EXEC_ID_ = '${taskId}';
      ;const hooks = Hooks(_EXEC_ID_);
      ;const WORK_FLOW_INFO = ${JSON.stringify({})};
      ;const logger = Logger(_EXEC_ID_);
      ;const PARAMS = ${JSON.stringify(params || {})};
      ;const Util = UTIL(_EXEC_ID_);
      ;${code};
    `;
    let res: any = {
      code: 1,
      data: null,
      msg: '',
    };
    try {
      const { success, data, msg } = await this.nodeVMIns.run(str);
      res = {
        code: success ? 1 : -1,
        data,
        msg,
      };
    } catch (e) {
      Logger.info(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`);
      res = {
        code: -1,
        msg: JSON.stringify(e),
      };
    }
    return res;
  }

  @Post('/system/test')
  async test(@Body('code') code: string, @Body('params') params: any) {
    const { success, data, msg } = await this.nodeVMIns.run(code, {
      injectParam: params,
    });
    return {
      code: success ? 1 : -1,
      data: data,
    };
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
    if(platformEnvUtils.isPlatform_Fangzhou()) {
      return {
        code: -1,
        msg: '该平台暂不支持此功能'
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
            console.log(e)
            return {
              code: -1,
              msg: e.message
            }
          }
        }
        case 'downloadPlatform': {
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
                content: `更新平台，版本从 ${prePlatformVersion} 到 ${version}`,
              })
            });
            return {
              code: 1,
              msg: log?.toString() || '升级成功'
            }
          } else {
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
      console.log(err)
      return {
        code: -1,
        msg: `[${type}]:` + err.message
      }
    }
  }

  @Post('/system/reloadAll')
  async reloadAll() {
    childProcess.exec(`npx pm2 reload all`)
    return {
      code: 1,
    };
  }

  @Get('/system/refactorUser')
  async refactorUser() {
    const tables = [
      {
        name: 'apaas_config',
        fieldName: ['creator_id', 'updator_id'],
      },
      {
        name: 'apaas_file',
        fieldName: ['creator_id', 'updator_id'],
      },
      {
        name: 'apaas_file_content',
        fieldName: ['creator_id'],
      },
      {
        name: 'apaas_file_cooperation',
        fieldName: ['user_id'],
      },
      {
        name: 'apaas_file_pub',
        fieldName: ['creator_id'],
      },
      {
        name: 'apaas_module_info',
        fieldName: ['creator_id'],
      },
      {
        name: 'apaas_module_pub_info',
        fieldName: ['creator_id'],
      },
      {
        name: 'apaas_project_info',
        fieldName: [],
      },
      {
        name: 'apaas_service_pub',
        fieldName: ['creator_id'],
      },
      {
        name: 'apaas_user',
        fieldName: [],
      },
      {
        name: 'apaas_user_file_relation',
        fieldName: ['creator_id', 'updator_id'],
      },
      {
        name: 'apaas_user_group',
        fieldName: ['creator_id', 'updator_id'],
      },
      {
        name: 'apaas_user_group_relation',
        fieldName: ['creator_id', 'updator_id', 'user_id'],
      },
      {
        name: 'apaas_user_log',
        fieldName: ['user_id'],
      },
      {
        name: 'apaas_user_session',
        fieldName: ['user_id'],
      },
      {
        name: 'domain_table_action',
        fieldName: ['creator_id'],
      },
      {
        name: 'domain_table_meta',
        fieldName: ['creator_id'],
      },
      {
        name: 'material_info',
        fieldName: ['creator_id', 'updator_id'],
      },
      {
        name: 'material_pub_info',
        fieldName: ['creator_id', 'updator_id'],
      }
    ];
    const allUser = await this.refreshDao.queryAll('apaas_user', ['email']);
    const userMap = allUser.reduce((pre, user) => ({ ...pre, [user.email]: user.id }), {});
    const ignoreList = [];

    for (const table of tables) {
      if (table && table.fieldName.length) {
        const ignoreTable = { name: table.name, fields: table.fieldName, ignoreList: [] };
        const tableInfo = await this.refreshDao.queryAll(table.name, table.fieldName);

        for (const item of tableInfo) {
          for (const field of table.fieldName) {
            if (typeof item[field] !== 'string' || Number(item[field]) == item[field]) {
              continue;
            }
            const userId = userMap[item[field]];

            if (userId) {
              await this.refreshDao.update({ table: table.name, id: item.id, value: userId, field });
            } else {
              ignoreTable.ignoreList.push(item.id);
            }
          }
        }

        if (ignoreTable.ignoreList.length) {
          ignoreList.push(ignoreTable);
        }
      }
    }

    if (ignoreList.length) {
      fs.writeFileSync(path.join(__dirname, './refreshIgnoreList.json'), JSON.stringify(ignoreList), 'utf-8');
    }

    return {
      code: 1,
      data: '刷新完成',
    };
  }
}
