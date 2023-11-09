import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { Logger } from '@mybricks/rocker-commons'
import LogService from '../module/log/log.service';

@Injectable()
export default class Task {
  logService: LogService;
  constructor() {
    this.logService = new LogService()
  }

  @Cron('0 0 1 * * *')
  async analyzeLogTask() {
    try {
      if(process.env.MYBRICKS_PLATFORM_ADDRESS?.indexOf('mybricks.world') !== -1) {
        Logger.info(`[analyzeLogTask]: 开始分析日志`)
        await this.logService.offlineAnalyzeInterfacePerformance()
        Logger.info(`[analyzeLogTask]: 日志分析完毕`)
      }
    } catch(e) {
      Logger.info(`[analyzeLogTask]: 日志分析失败: ${e.message}`)
    }
  }
}