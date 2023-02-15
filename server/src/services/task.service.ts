import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import FileTaskLogDao from "../dao/FileTaskLogDao";
import FileTaskDao from "../dao/FileTaskDao";
import { CronJob } from "cron";
import { NodeVM } from "vm2";
import * as path from "path";
import { RunningStatusMap } from "../constants";
@Injectable()
export default class TaskService {
  private readonly logger = new Logger(TaskService.name);

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
              console.log(...args);
              await this.fileTaskLogDao.createFileTask({
                content: JSON.stringify(args),
                fileTaskId: +taskId,
              });
            },
            error: async (...args) => {
              console.log(...args);
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
      console.log(e);
      return false;
    }
  }

  _checkJobExisted(jobName) {
    let job;
    try {
      job = this.schedulerRegistry.getCronJob(jobName);
    } catch (e) {
      console.log(e);
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
        this.logger.warn(
          `定时任务添加成功: 新建任务名: ${query.cronName}, 表达式：${query.cronExp}`
        );
      } else {
        this.logger.warn(
          `定时任务添加成功: 存在历史任务: ${query.cronName}, 本次创建忽略`
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  runJob(name: string) {
    let job;
    try {
      job = this.schedulerRegistry.getCronJob(name);
      console.log("@@@@", job);
    } catch (e) {
      console.log(e);
    }
    if (!job) {
      this.logger.warn(`job ${name} not exist!`);
      return false;
    }
    job.start();
    this.logger.warn(`job ${name} is running!`);
    return true;
  }

  stopJob(name: string) {
    let job;
    try {
      job = this.schedulerRegistry.getCronJob(name);
      this.logger.warn(`获取到了任务!`);
    } catch (e) {
      console.log(e);
    }
    if (!job) {
      this.logger.warn(`job ${name} not exist!`);
      return false;
    }
    job.stop();
    this.logger.warn(`job ${name} is stop!`);
    return true;
  }

  deleteJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.warn(`job ${name} deleted!`);
  }

  // 查询
  getAllJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key, map) => {
      console.log("!!", value, key);
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
