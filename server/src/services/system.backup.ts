import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { NodeVM } from "vm2";
import * as path from "path";
import FileDao from "../dao/FileDao";
import FilePubDao from "../dao/filePub.dao";
import { uuid } from "../utils/index";
import { getConnection } from "@mybricks/rocker-dao";
var EventEmitter2 = require("eventemitter2");
// @ts-ignore
import { createVM } from 'vm-node';

@Controller("/paas/api")
export default class SystemService {
  @Inject(FileDao)
  fileDao: FileDao;

  @Inject(FilePubDao)
  filePubDao: FilePubDao;

  conn: any;

  eventBus: any;

  nodeVMIns: any

  constructor() {
    this.eventBus = new EventEmitter2({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    });
    this.conn = null;
    this.nodeVMIns = createVM({ openLog: true })
  }

  checkSqlValid(sql) {
    let blackOpList = ['create ', 'alter ', 'drop ', 'truncate ', 'show ']
    let lowerStr = sql.toLowerCase()
    let result = true;
    blackOpList.forEach(blackOp => {
      if(lowerStr.indexOf(blackOp) !== -1) {
        result = false
      }
    })
    return result
  }

  async exec(codeContent: string, { taskId }: { taskId: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore
        this.eventBus.on(`TASK_DONE_${taskId}`, (data) => {
          resolve({
            success: true,
            data: data.data
          });
        });
        // @ts-ignore
        this.eventBus.on(`TASK_ERROR_${taskId}`, (data) => {
          console.log('监测到业务出错', data)
          resolve({
            success: false,
            msg: data.data,
          });
        });
        // @ts-ignore
        const sandbox = new NodeVM({
          console: "off",
          sandbox: {
            Logger: (taskId) => {
              return console;
            },
            Hooks: (taskId) => {
              return {
                onFinished: (data: { code: number; msg: string }) => {
                  // @ts-ignore
                  this.eventBus.emit(`TASK_DONE_${taskId}`, {
                    taskId,
                    data,
                  });
                },
              };
            },
            UTIL: (taskId) => {
              return {
                execSQL: async (sql, args) => {
                  let isValid = this.checkSqlValid(sql)
                  if(!isValid) {
                    console.log('非法 SQL')
                    // @ts-ignore
                    this.eventBus.emit(`TASK_ERROR_${taskId}`, {
                      taskId,
                      data: `非法SQL: ${sql}`,
                    });
                    return
                  }
                  let res = null
                  try {
                    console.log('开始执行沙箱内sql')
                    res = await this._execSQL(sql, args)
                    console.log('执行沙箱内sql成功')
                    return res
                  } catch (error) {
                    console.log('执行沙箱内sql出错', error)
                    // @ts-ignore
                    this.eventBus.emit(`TASK_ERROR_${taskId}`, {
                      taskId,
                      data: error,
                    });
                  }
                }
              }
            }
          },
          require: {
            external: true,
            root: "./",
          },
        });
        sandbox.run(codeContent, path.join(process.cwd(), "node_modules"));
      } catch (e) {
        resolve({
          success: false,
          msg: e.toString(),
        })
      }
    });
  }

  async _execSQL(sql: string, args?: any) {
    if(!this.conn) {
      this.conn = await getConnection();
    }
    const conn = this.conn
    const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
      return ' '
    })
    let param = {
      sql: handledSql,
      timeout: 10 * 1000,
    };
    if (args) {
      param["values"] = args;
    }
    return new Promise((resolve, reject) => {
      let tdId = conn.threadId;
      conn.beginTransaction(function(_e) {
        if (_e) {
          console.log(`[${tdId}]: Transaction failed`);
          reject(_e);
        }
        console.log(`[${tdId}]: Transaction start`);
        try {
          conn.query(param, args, function (error, results, fields) {
            if (error) {
              console.log('执行业务SQL失败：', error)
              conn.rollback(function() {
                console.log(`[${tdId}]: Transaction rollback`);
              });
              reject(error);
            }
            conn.commit(function(err) {
              if (err) {
                console.log(err)
                conn.rollback(function() {
                  console.log(`[${tdId}]: Transaction rollback`);
                });
                reject(err)
              }
            });
            console.log(`[${tdId}]: Transaction succeed`);
            resolve(results);
          }).once('end', () => {
            console.log(`[${tdId}]: Transaction Query End: Connection Released`);
            conn.release();
          });
        } catch (e) {
          console.log(`[${tdId}]: Transaction Query Failed: Connection Released`);
          conn.release();
          reject(e);
        }
      });
    });
  }

  // 流水线应用运行时：用于页面发布流程定制
  @Post("/system/task/run")
  async systemTaskRun(
    @Body("fileId") fileId: string,
    @Body("version") version: string,
    @Body("injectParam") injectParam: string
  ) {
    const pubInfo = await this.filePubDao.getPublishByFileIdAndVersion({
      fileId,
      version,
    });
    // @ts-ignore
    const codeStr = pubInfo.content;
    const taskId = uuid(10);
    const workFlowInfo = {
      fileId,
      pubVersion: version,
    };
    const str = `
      ;const _EXEC_ID_ = '${taskId}';
      ;const WORK_FLOW_INFO = ${JSON.stringify(workFlowInfo)};
      ;const hooks = Hooks(_EXEC_ID_);
      ;const logger = Logger(_EXEC_ID_);
      ;const PARAMS = ${injectParam};
      ;${codeStr};
    `;
    let res = {
      code: 1,
      data: null,
      msg: ''
    }
    try {
      const {success, data, msg} = await this.exec(str, { taskId })
      res = {
        code: success ? 1 : -1,
        data,
        msg
      }
    } catch(e) {
      console.log(`[/system/task/run]: 出错 ${JSON.stringify(e)}`)
      res.code = -1;
      res.msg = JSON.stringify(e.msg);
    }
    return res
  }

  @Post("/system/workflow/run")
  async systemWorkflowRun(
    @Body("fileId") fileId: string,
    @Body("version") version: string,
    @Body("params") params: any
  ) {
    if(!fileId) {
      return {
        code: -1,
        msg: '缺少 fileId'
      }
    }
    let pubInfo = null;
    if (!version) {
      pubInfo = (await this.filePubDao.getLatestPubByFileId(+fileId, 'prod'))[0];
    } else {
      pubInfo = await this.filePubDao.getPublishByFileIdAndVersion({
        fileId,
        version,
      });
    }

    // @ts-ignore
    const codeStr = pubInfo.content;
    console.log('获得的代码是', codeStr)
    const taskId = uuid(10);
    const str = `
      ;const _EXEC_ID_ = '${taskId}';
      ;const hooks = Hooks(_EXEC_ID_);
      ;const logger = Logger(_EXEC_ID_);
      ;const PARAMS = ${JSON.stringify(params || {})};
      ;${codeStr};
    `;
    let res = {
      code: 1,
      data: null,
      msg: ''
    }
    try {
      const {success, data, msg} = await this.exec(str, { taskId })
      res = {
        code: success ? 1 : -1,
        data,
        msg
      }
    } catch(e) {
      console.log(`[/system/workflow/run]: 出错 ${JSON.stringify(e)}`)
      res.code = -1;
      res.msg = JSON.stringify(e.msg);
    }
    return res
  }

  @Post("/system/domain/list")
  async getDomainServiceList() {
    try {
      let totalList = []
      const domainFiles = await this.fileDao.pureQuery({
        extName: 'domain'
      })
      const fileInfoMap = {}
      domainFiles?.map(f => {
        fileInfoMap[f.id] = f
      })
      const fileIds: any[] = Object.keys(fileInfoMap) || [];
      const pubContentList = await this.filePubDao.getLatestPubByIds({
        ids: fileIds,
        envType: 'prod'
      })
      pubContentList?.forEach(pubContent => {
        const contentObj = typeof pubContent.content === 'string' ? JSON.parse(pubContent.content) : pubContent.content
        if(contentObj?.serviceAry) {
          let service = {
            fileId: pubContent.fileId,
            fileName: fileInfoMap[pubContent.fileId]?.name,
            serviceList: []
          }
          contentObj?.serviceAry?.forEach(s => {
            service.serviceList.push({
              serviceId: s.id,
              title: s.title,
              paramAry: s.paramAry
            })
          })
          totalList.push(service)
        }
      })
      return {
        code: 1,
        data: totalList
      }
    } catch(e) {
      return {
        code: -1,
        data: [],
        msg: `获取接口列表失败: ${JSON.stringify(e)}`
      }
    }
  }

  // 领域建模运行时
  @Post("/system/domain/run")
  async systemDomainRun(
    @Body("fileId") fileId: string,
    @Body("serviceId") serviceId: string,
    @Body("params") params: any
  ) {
    if(!fileId || !serviceId) {
      return {
        code: -1,
        msg: '缺少 fileId 或 serviceId'
      }
    }
    const [pubInfo]: any = await this.filePubDao.getLatestPubByFileId(+fileId, 'prod');
    if(pubInfo?.content) {
      const contentObj = JSON.parse(pubInfo?.content)
      let codeStr = '';
      contentObj?.serviceAry?.forEach(service => {
        if(service.id === serviceId) {
          codeStr = decodeURIComponent(service.code)
        }
      })
      if(codeStr) {
        const taskId = uuid(10);
        const str = `
          ;const _EXEC_ID_ = '${taskId}';
          ;const hooks = Hooks(_EXEC_ID_);
          ;const logger = Logger(_EXEC_ID_);
          ;const PARAMS = ${JSON.stringify(params || {})};
          ;const Util = UTIL(_EXEC_ID_);
          ;${codeStr};
        `;
        let res = {
          code: 1,
          data: null,
          msg: ''
        }
        try {
          const {success, data, msg} = await this.exec(str, { taskId })
          res = {
            code: success ? 1 : -1,
            data,
            msg
          }
        } catch(e) {
          console.log(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`)
          res.code = -1;
          res.msg = JSON.stringify(e.msg);
        }
        return res
      } else {
        return {
          code: -1,
          msg: `未找到 ${fileId} 下的服务 ${serviceId}, 请确认！`
        }
      }
    }
  }

  @Post("/system/domain/execSql")
  async execSql(
    @Body("sql") sql: string,
    @Body("params") params: any[],
    @Body("pwd") pwd: string,
  ) {
    if(!sql || !pwd || pwd !== 'fangzhouapaas') {
      return {
        code: -1,
        msg: 'sql字段不能为空'
      }
    }
    let execRes = {}
    try {
      execRes = await this._execSQL(sql, params ?? []);
      return {
        code: 1,
        data: execRes,
        msg: ''
      };
    } catch(e) {
      console.log(`[/system/domain/execSql]: 出错 ${JSON.stringify(e)}`)
      return {
        code: -1,
        msg: JSON.stringify(e)
      };
    }
    
  }

  @Post("/system/sandbox/testRun")
  async testRun(
    @Body("code") code: string,
    @Body("params") params: any
  ) {
    if(!code) {
      return {
        code: -1,
        msg: '缺少 code'
      }
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
      msg: ''
    }
    try {
      const {success, data, msg} = await this.exec(str, { taskId })
      res = {
        code: success ? 1 : -1,
        data,
        msg
      }
    } catch(e) {
      console.log(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`)
      res = {
        code: -1,
        msg: JSON.stringify(e)
      }
    }
    return res;
  }

  @Post("/system/test")
  async test(
    @Body("code") code: string,
    @Body("params") params: any
  ) {
    const res = await this.nodeVMIns.run(code, {
      injectParam: params
    })
    return {
      code: 1,
      data: res
    }
  }

  
}
