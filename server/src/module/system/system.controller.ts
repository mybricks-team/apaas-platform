import ServicePubDao from './../../dao/ServicePubDao';
import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import FileDao from '../../dao/FileDao';
import FilePubDao from '../../dao/filePub.dao';
import { uuid } from '../../utils/index';
import { getConnection } from '@mybricks/rocker-dao';
// @ts-ignore
import { createVM } from 'vm-node';
import FileService from '../file/file.controller'
const childProcess = require('child_process');

@Controller('/paas/api')
export default class SystemService {
  fileDao: FileDao;

  filePubDao: FilePubDao;

  servicePubDao: ServicePubDao

  fileService: FileService

  conn: any;

  nodeVMIns: any;

  constructor() {
    this.fileDao = new FileDao();
    this.filePubDao = new FilePubDao();
    this.servicePubDao = new ServicePubDao();
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
          console.log(`[${tdId}]: Transaction failed`);
          reject(_e);
        }
        console.log(`[${tdId}]: Transaction start`);
        try {
          conn
            .query(param, args, function (error, results, fields) {
              if (error) {
                console.log('执行业务SQL失败：', error);
                conn.rollback(function () {
                  console.log(`[${tdId}]: Transaction rollback`);
                });
                reject(error);
              }
              conn.commit(function (err) {
                if (err) {
                  console.log(err);
                  conn.rollback(function () {
                    console.log(`[${tdId}]: Transaction rollback`);
                  });
                  reject(err);
                }
              });
              console.log(`[${tdId}]: Transaction succeed`);
              resolve(results);
            })
            .once('end', () => {
              console.log(
                `[${tdId}]: Transaction Query End: Connection Released`,
              );
              conn.release();
            });
        } catch (e) {
          console.log(
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
      console.log(`[/system/task/run]: 出错 ${JSON.stringify(e)}`);
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
      console.log(`[/system/workflow/run]: 出错 ${JSON.stringify(e)}`);
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
      console.log("~~~~~~~~~~~~~~~~~~~~~~")
      console.log(e);
      console.log("~~~~~~~~~~~~~~~~~~~~~~")
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
					envType: 'prod',
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
    fileId
  }) {
    try {
      if(!pubInfo) {
        return {
          code: -1,
          msg: `未找到 ${fileId} 下的服务 ${serviceId}, 请确认！`,
        };
      }
      const codeStr = decodeURIComponent(pubInfo?.content);
      let res = {
        code: 1,
        data: null,
        msg: '',
      };
      try {
        const { success, data, msg } = await this.nodeVMIns.run(codeStr, {
          injectParam: params
        });
        res = {
          code: success ? 1 : -1,
          data,
          msg,
        };
      } catch (e) {
        console.log(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`);
        res.code = -1;
        res.msg = JSON.stringify(e.msg);
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
    @Body('fileId') fileId: number
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
      serviceId
    })
    const res = await this._execServicePub(pubInfo, {
      fileId,
      serviceId,
      params,
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
      console.log(`[/system/domain/execSql]: 出错 ${JSON.stringify(e)}`);
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
      console.log(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`);
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
    // const str = `
    //     const Hooks = (taskId) => {
    //       return {
    //         onFinished: (data) => {
    //           console.log('沙箱结果', data)
    //         }
    //       }
    //     };
    //     ;const _EXEC_ID_ = 1111;
    //     ;const hooks = Hooks(_EXEC_ID_);
    //     ;const PARAMS = ` + JSON.stringify(params || {}) + ';' + code
    // return {
    //   code: 1,
    //   data: str
    // }
  }

  @Post('/system/checkUpdate')
  async checkUpdate() {
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
}
