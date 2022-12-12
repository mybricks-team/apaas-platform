import { Body, Controller, Get, Inject, Post, Query } from "@nestjs/common";
import FileDao from "../dao/FileDao";
import FileTaskDao from "../dao/FileTaskDao";
import TaskService from "./task.service";
import { RunningStatusMap, TaskTypeMap } from "../constants";

@Controller("/api/task")
export default class TaskController {
  @Inject(TaskService)
  taskService: TaskService;

  @Inject(FileDao)
  fileDao: FileDao;

  @Inject(FileTaskDao)
  fileTaskDao: FileTaskDao;

  @Post("/checkStatusByFile")
  async checkStatusByFile(
    @Body("userId") userId: string,
    @Body("fileId") fileId: number,
    @Body("type") type: string
  ) {
    if (!userId || !fileId || !type) {
      return {
        code: -1,
        message: "缺乏必要参数",
      };
    }

    try {
      const rtn = await this.fileTaskDao.queryRunningTaskByFileId(fileId);
      const existRunningTask = rtn?.length !== 0;
      const runningId = rtn?.[0]?.id;
      return {
        code: 1,
        data: {
          existRunningTask,
          runningId,
        },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/create")
  async create(
    @Body("userId") userId: string,
    @Body("name") name: string,
    @Body("content") content: string,
    @Body("metaInfo") metaInfo: string,
    @Body("type") type: string,
    @Body("fileId") fileId: number
  ) {
    if (!userId || !name || !content || !type || !fileId) {
      return {
        code: -1,
        message: "缺乏必要参数",
      };
    }

    try {
      const rtn = await this.fileTaskDao.createFileTask({
        metaInfo,
        fileId,
        name,
        type,
        content,
        runningStatus: RunningStatusMap.STOPPED,
        creatorId: userId,
        creatorName: userId,
      });

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/run")
  async run(@Body("userId") userId: string, @Body("id") id: number) {
    if (!userId || !id) {
      return {
        code: -1,
        message: "缺乏必要参数",
      };
    }

    try {
      const rtn = await this.fileTaskDao.queryContentById(+id);
      if (rtn) {
        if (rtn.type === "timer-service") {
          const metaInfo = JSON.parse(rtn.metaInfo);
          let isSuccess;
          if (metaInfo.cronConfig.type === TaskTypeMap.IMMEDIATE) {
            // 立即执行任务
            isSuccess = this.taskService.exec(
              this._injectContent(rtn.content, {
                taskId: rtn.id,
              })
            );
            if (isSuccess) {
              this.fileTaskDao.update({
                id: id,
                updatorName: userId,
                updatorId: userId,
                runningStatus: RunningStatusMap.STOPPED,
              });
            } else {
              return {
                code: 1,
                msg: "启动失败，请重试",
              };
            }
          } else {
            if (!metaInfo.cronConfig.exp) {
              return {
                code: -1,
                message: "启动失败: 定时表达式为空，请先设置",
              };
            }
            // 延时执行任务
            this.taskService.addJob({
              cronName: `${rtn.id}`,
              cronExp: metaInfo.cronConfig.exp,
              execContent: this._injectContent(rtn.content, {
                taskId: rtn.id,
              }),
            });
            isSuccess = this.taskService.runJob(`${rtn.id}`);
            if (isSuccess) {
              this.fileTaskDao.update({
                id: id,
                updatorName: userId,
                updatorId: userId,
                runningStatus: RunningStatusMap.RUNNING,
              });
            } else {
              return {
                code: -1,
                msg: "启动失败，请重试",
              };
            }
          }
        }

        return {
          code: 1,
          data: { id: rtn.id },
        };
      } else {
        return {
          code: -1,
          message: "未找到任务",
        };
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/stop")
  async stop(@Body("userId") userId: string, @Body("id") id: number) {
    if (!userId || !id) {
      return {
        code: -1,
        message: "缺乏必要参数",
      };
    }

    try {
      const rtn = await this.fileTaskDao.queryById(+id);
      if (rtn) {
        if (rtn.type === "timer-service") {
          //定时任务
          this.taskService.stopJob(`${rtn.id}`);
          this.fileTaskDao.update({
            id: id,
            updatorName: userId,
            updatorId: userId,
            runningStatus: RunningStatusMap.STOPPED,
          });
        }

        return {
          code: 1,
          data: { id: rtn.id },
        };
      } else {
        return {
          code: -1,
          message: "未找到任务",
        };
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/getAllJobs")
  async getAll(@Body("userId") userId: string) {
    if (!userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileTaskDao.query({ creatorId: userId });
      return {
        code: 1,
        data: rtn,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/deleteTask")
  async delete(@Body("userId") userId: string, @Body("id") id: number) {
    if (!userId || !id) {
      return {
        code: -1,
        message: "缺乏必要参数",
      };
    }

    try {
      const taskInfo = await this.fileTaskDao.queryById(id);
      this.taskService.stopJob(taskInfo.name);
      const rtn = await this.fileTaskDao.deleteFileTask({
        updatorId: userId,
        updatorName: userId,
        id: +id,
      });
      return {
        data: rtn,
        code: 1,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/getLogsById")
  async getLogsById(
    @Body("userId") userId: string,
    @Body("jobId") jobId: number
  ) {
    if (!userId || !jobId) {
      return {
        code: -1,
        message: "缺少参数",
      };
    }

    try {
      const rtn = await this.taskService.getAllLogs(jobId);
      return {
        code: 1,
        data: rtn,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/getLogsByFileId")
  async getLogsByFileId(
    @Body("userId") userId: string,
    @Body("fileId") fileId: number,
    @Body("offset") offset: number,
    @Body("limit") limit: number
  ) {
    if (!userId || !fileId || !limit) {
      return {
        code: -1,
        message: "缺少参数",
      };
    }

    try {
      const tasks = await this.fileTaskDao.query({
        fileId,
      });
      const fileTaskIds = tasks?.map((task) => task.id);
      const total = await this.taskService.getTotalCountOfFileTaskIds({
        fileTaskIds,
      });

      const logs = await this.taskService.queryByFileTaskIdOfPage({
        fileTaskIds,
        offset: offset || 0,
        limit,
      });

      return {
        code: 1,
        data: {
          logs,
          total: total,
          offset: offset,
          limit: limit,
        },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  _injectContent(codeString: string, { taskId }) {
    let newStr = `;const logger = Logger(${taskId});` + codeString;
    return newStr;
  }
}
