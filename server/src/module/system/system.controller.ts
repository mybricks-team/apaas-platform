import ServicePubDao from './../../dao/ServicePubDao';
import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import FileDao from '../../dao/FileDao';
import FilePubDao from '../../dao/filePub.dao';
import AppDao from '../../dao/AppDao';
import { uuid } from '../../utils/index';
import { getConnection } from '@mybricks/rocker-dao';
import { Logger } from '@mybricks/rocker-commons';
// @ts-ignore
import { createVM } from 'vm-node';
import FileService from '../file/file.controller'
import * as axios from "axios";
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

  fileService: FileService

  conn: any;

  nodeVMIns: any;

  constructor() {
    this.fileDao = new FileDao();
    this.filePubDao = new FilePubDao();
    this.servicePubDao = new ServicePubDao();
    this.appDao = new AppDao()
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

  @Post('/system/channel')
  async checkUpdate(@Body() body: any) {
    const { type, version } = body;
    switch (type) {
      case 'checkLatestPlatformVersion': {
        const res = (await (axios as any).post(
          'https://my.mybricks.world/central/api/channel/gateway', 
          // 'http://localhost:4100/central/api/channel/gateway', 
          {
          action: 'platform_checkLatestVersion'
        })).data
        if(res.code === 1) {
          return {
            code: 1,
            data: { version: res.data.version }
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
            data: platformVersion,
            msg: 'success'
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
          const log = await childProcess.execSync(`sh ${shellPath} ${version}`, {
            cwd: path.join(process.cwd(), '../'),
          })
          return {
            code: 1,
            msg: log.toString() || '升级成功'
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
    }
    return {
      code: -1,
      msg: '未知指令'
    }
  }


  async checkUpdate_back(@Body() body: any) {
    const { type, version } = body;
    console.log('111', process.env.MYBRICKS_NODE_MODE)
    if(process.env.MYBRICKS_NODE_MODE === 'master') {
      switch (type) {
        case 'checkLatestPlatformVersion': {
          const res = (await (axios as any).post(
            'https://my.mybricks.world/central/api/channel/gateway', 
            // 'http://localhost:4100/central/api/channel/gateway', 
          {
            action: 'platform_checkLatestVersion'
          })).data
          if(res.code === 1) {
            return {
              code: 1,
              data: { version: res.data.version }
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
          if(!fs.existsSync(path.join(process.cwd(), '../_temp_'))) {
            fs.mkdirSync(path.join(process.cwd(), '../_temp_'))
          }
          // @ts-ignore
          fs.copyFileSync(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `./platform/${version}/mybricks-apaas.zip`), path.join(process.cwd(), '../_temp_/mybricks-apaas.zip'))

          const shellPath = path.join(process.cwd(), '../upgrade_platform.sh')
          Logger.info(shellPath)
          const log = await childProcess.execSync(`sh ${shellPath} ${version}`, {
            cwd: path.join(process.cwd(), '../'),
          })
          return {
            code: 1,
            msg: log.toString() || '升级成功'
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
      }
      return {
        code: -1,
        msg: '未知指令'
      }
    } else {
      switch (type) {
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
        case 'checkLatestPlatformVersion': {
          const res = await (axios as any).post('https://my.mybricks.world/paas/api/system/channel', body)
          return res.data
        }
        case 'downloadPlatform': {
          const res = await (axios as any).get(`https://my.mybricks.world/runtime/mfs/platform/${version}/mybricks-apaas.zip`, {
            responseType: "arraybuffer",
          })
          if(!fs.existsSync(path.join(process.cwd(), '../_temp_'))) {
            fs.mkdirSync(path.join(process.cwd(), '../_temp_'))
          }
          fs.writeFileSync(path.join(process.cwd(), '../_temp_/mybricks-apaas.zip'), res.data);
          
          const shellPath = path.join(process.cwd(), '../upgrade_platform.sh')
          Logger.info(shellPath)
          const log = await childProcess.execSync(`sh ${shellPath} ${version}`, {
            cwd: path.join(process.cwd(), '../'),
          })
          return {
            code: 1,
            msg: log.toString() || '升级成功'
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
      }
    }
  }

  @Post('/system/doUpdate')
  async doUpdate(@Body('version') version) {
    if(!version) {
      return {
        code: -1,
        msg: '缺少必要参数'
      }
    }
    const shellPath = path.join(process.cwd(), '../upgrade_platform.sh')
    Logger.info(shellPath)
    const res = await childProcess.execSync(`sh ${shellPath} ${version}`, {
      cwd: path.join(process.cwd(), '../'),
    })
    return {
      code: 1,
      msg: res.toString(),
    };
  }


  @Post('/system/reloadAll')
  async reloadAll() {
    childProcess.exec(`npx pm2 reload all`)
    return {
      code: 1,
    };
  }
}
