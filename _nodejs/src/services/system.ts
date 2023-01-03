import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { NodeVM } from "vm2";
import * as path from "path";
import FileDao from "../dao/FileDao";
import FilePubDao from "../dao/filePub.dao";
import { uuid } from "../utils/index";
import { getConnection } from "@mybricks/rocker-dao";
var EventEmitter2 = require("eventemitter2");

@Controller("/paas/api")
export default class SystemService {
  @Inject(FileDao)
  fileDao: FileDao;

  @Inject(FilePubDao)
  filePubDao: FilePubDao;

  constructor() {
    // @ts-ignore
    this.eventBus = new EventEmitter2({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    });
    // @ts-ignore
    this.sandbox = new NodeVM({
      console: "off",
      sandbox: {
        Logger: (taskId) => {
          return {
            log: async (...args) => {
              console.log(...args);
            },
            error: async (...args) => {
              console.log(...args);
            },
          };
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
      },
      require: {
        external: true,
        root: "./",
      },
    });
  }

  async exec(codeContent: string, { taskId }: { taskId: string }) {
    return new Promise((resolve, reject) => {
      try {
        // console.log(codeContent);
        // @ts-ignore
        this.sandbox.run(codeContent, path.join(process.cwd(), "node_modules"));
        // @ts-ignore
        this.eventBus.on(`TASK_DONE_${taskId}`, (data) => {
          resolve(data.data);
        });
      } catch (e) {
        console.log(e);
        reject({
          code: -1,
          msg: JSON.stringify(e),
        });
      }
    });
  }

  async execSQL(sql: string, args?: any) {
    const conn = await getConnection();
    let param = {
      sql,
      timeout: 10 * 1000,
    };
    if (args) {
      param["values"] = args;
    }
    return new Promise((resolve, reject) => {
      conn.query(param, args, function (error, results, fields) {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
  }

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
    const execRes = await this.exec(str, { taskId });
    return execRes;
  }

  @Post("/system/domain/execSql")
  async execSql(
    @Body("sql") sql: string,
    @Body("param") param: string,
  ) {
    if(!sql) {
      return {
        code: -1,
        msg: 'sql字段不能为空'
      }
    }
    let execRes = {}
    try {
      execRes = await this.execSQL(sql, param ?? []);
    } catch(e) {
      console.log(`[/system/domain/execSql]: 出错 ${JSON.stringify(e)}`)
    }
    return {
      code: 1,
      data: execRes
    };
  }
}
