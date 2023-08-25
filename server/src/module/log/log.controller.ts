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
const cp = require('child_process')
const path = require('path')
const env = require('../../../env.js')


@Controller('/paas/api/log')
export default class LogsController {

  @Post('/search')
  search(@Body('searchValue') searchValue: string, @Body('line') line: number) {
    const LINES = line || 100
    const fileName = path.join(env.LOGS_BASE_FOLDER, './application/application.log')
    const logStr = cp.execSync(`tail -n ${LINES} ${fileName}`).toString()

    return {
      code: 1,
      data: {
        content: logStr
      }
    }
  }
}