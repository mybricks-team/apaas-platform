import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import { NodeVM } from "vm2";
import * as path from "path";
import FileDao from "../dao/FileDao";
import FilePubDao from "../dao/filePub.dao";
import {uuid} from '../utils/index'
var EventEmitter2 = require('eventemitter2');

@Controller("api")
export default class SystemService {
  @Inject(FileDao)
  fileDao: FileDao;

  @Inject(FilePubDao)
  filePubDao: FilePubDao;

  constructor() {
    // @ts-ignore
    this.eventBus = new EventEmitter2({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false
    })
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
          }
        },
        Hooks: (taskId) => {
          return {
            onFinished: () => {
              // @ts-ignore
              this.eventBus.emit(`TASK_DONE_${taskId}`, {
                taskId
              })
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

  async exec(codeContent: string, { taskId }: {taskId: string}) {
    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore
        this.sandbox.run(
          codeContent,
          path.join(process.cwd(), "node_modules")
        );
        // @ts-ignore
        this.eventBus.on(`TASK_DONE_${taskId}`, (data) => {
          resolve(true);
        })
      } catch (e) {
        console.log(e);
        reject(e);
      }
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
    const taskId = uuid(10)
    const str = `
      ;const _EXEC_ID_ = '${taskId}';
      ;const hooks = Hooks(_EXEC_ID_);
      ;const logger = Logger(_EXEC_ID_);
      ;const PARAMS = ${injectParam};
      ;${codeStr};
    `
    await this.exec(str, {taskId});
    return {
      code: 1,
      data: {},
      msg: '发布完成'
    };
  }
}
