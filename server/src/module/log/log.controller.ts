import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import LogService from './log.service';
import { Logger } from '@mybricks/rocker-commons';
const cp = require('child_process')
const path = require('path')
const env = require('../../../env.js')


@Controller('/paas/api/log')
export default class LogsController {
  logService: LogService;

  constructor() {
    this.logService = new LogService()
  }

  @Post('/runtimeLog/search')
  search(@Body('searchValue') searchValue: string, @Body('line') line: number) {
    try {
      const LINES = line || 100
      const fileName = path.join(env.LOGS_BASE_FOLDER, './application/application.log')
      let logStr;

      if(searchValue) {
        logStr = cp.execSync(`tail -n ${LINES} ${fileName} | grep '${searchValue}'`).toString()
      } else {
        logStr = cp.execSync(`tail -n ${LINES} ${fileName}`).toString()
      }
  
      return {
        code: 1,
        data: {
          content: logStr
        }
      }
    } catch(e) {
      Logger.warn('获取运行日志失败')
      return {
        code: -1,
        msg: e.message || '更新失败'
      }
    }
  }


  @Post('/operateLog/search')
  async getOperateLog(
    @Body('pageNum') pageNum: number,
    @Body('pageSize') pageSize: number
  ) {
    const curPageNum = pageNum ? Number(pageNum) : 1;
    const curPageSize = pageSize ? Number(pageSize) : 20;
    const result = await this.logService.getOperateLog({ limit: curPageSize, offset: curPageSize * (curPageNum - 1) })
    return {
      code: 1,
      data: {
        pageNum: curPageNum,
        pageSize: curPageSize,
        ...result
      }
    }
  }
}