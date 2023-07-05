import { Inject, Injectable } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import FileTaskLogDao from "../dao/FileTaskLogDao";
import FileTaskDao from "../dao/FileTaskDao";
import { CronJob } from "cron";
import { NodeVM } from "vm2";
import * as path from "path";
import { RunningStatusMap } from "../constants";
import { Logger } from '@mybricks/rocker-commons'
@Injectable()
export default class TaskService {

  private readonly fileTaskLogDao = new FileTaskLogDao();

  private readonly fileTaskDao = new FileTaskDao();

  constructor(private schedulerRegistry: SchedulerRegistry) {
    // @ts-ignore
    this.sandbox = new NodeVM({
      console: "off",
      sandbox: {
        // 沙箱中全局上下文能够访问的依赖
        Logger: (taskId) => {
          return {
            log: async (...args) => {
              Logger.info(`[沙箱执行日志]: ${args}`);
              await this.fileTaskLogDao.createFileTask({
                content: JSON.stringify(args),
                fileTaskId: +taskId,
              });
            },
            error: async (...args) => {
              Logger.info(`[沙箱执行日志]: ${args}`);
              await this.fileTaskLogDao.createFileTask({
                content: JSON.stringify(args),
                fileTaskId: +taskId,
              });
              await this.fileTaskDao.update({
                id: +taskId,
                runningStatus: RunningStatusMap.RUNNING_WITH_ERROR,
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

  exec(codeContent: string) {
    try {
      // @ts-ignore
      this.sandbox.run(codeContent, path.join(process.cwd(), "node_modules"));
      return true;
    } catch (e) {
      Logger.info(`[沙箱执行出错]: ${e.message}`);
      return false;
    }
  }

  _checkJobExisted(jobName) {
    let job;
    try {
      job = this.schedulerRegistry.getCronJob(jobName);
    } catch (e) {
      Logger.info(`[检查任务是否存在]: ${e.message}`);
    }
    return job;
  }

  addJob(query: { cronName: string; cronExp: number; execContent: string }) {
    const existedJob = this._checkJobExisted(query.cronName);
    try {
      if (!existedJob) {
        let job = new CronJob(query.cronExp, () => {
          this.exec(query.execContent);
        });
        this.schedulerRegistry.addCronJob(query.cronName, job);
        Logger.info(`定时任务添加成功: 新建任务名: ${query.cronName}, 表达式：${query.cronExp}`);
      } else {
        Logger.info(
          `定时任务添加成功: 存在历史任务: ${query.cronName}, 本次创建忽略`
        );
      }
    } catch (error) {
      Logger.info(error);
    }
  }

  runJob(name: string) {
    let job;
    try {
      job = this.schedulerRegistry.getCronJob(name);
    } catch (e) {
      Logger.info(e);
    }
    if (!job) {
      Logger.info(`job ${name} not exist!`);
      return false;
    }
    job.start();
    Logger.info(`job ${name} is running!`);
    return true;
  }

  stopJob(name: string) {
    let job;
    try {
      job = this.schedulerRegistry.getCronJob(name);
      Logger.info(`获取到了任务!`);
    } catch (e) {
      Logger.info(e);
    }
    if (!job) {
      Logger.info(`job ${name} not exist!`);
      return false;
    }
    job.stop();
    Logger.info(`job ${name} is stop!`);
    return true;
  }

  deleteJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    Logger.info(`job ${name} deleted!`);
  }

  // 查询
  getAllJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key, map) => {
    });
  }

  async getAllLogs(taskId) {
    const rtn = await this.fileTaskLogDao.queryByFileTaskId(+taskId);
    return rtn;
  }

  async getTotalCountOfFileTaskIds(query: { fileTaskIds: number[] }) {
    const rtn = await this.fileTaskLogDao.queryTotalCountOfFileTaskIds(query);
    return rtn;
  }

  async queryByFileTaskIdOfPage(query: {
    fileTaskIds: number[];
    limit: number;
    offset: number;
  }) {
    const rtn = await this.fileTaskLogDao.queryByFileTaskIdOfPage(query);
    return rtn;
  }
}
