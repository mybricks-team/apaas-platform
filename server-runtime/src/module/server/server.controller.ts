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
const childProcess = require('child_process');
const path = require('path');

@Controller('/runtime/api/server')
export default class FlowController {
  serverStatus: string
  constructor() {
    this.serverStatus = 'running'
  }
  
  // 领域建模运行时(运行时)
  @Post('/reload')
  async systemDomainRun() {
    if (this.serverStatus !== 'running') {
      return {
        code: -1,
        msg: '服务不在运行状态，无法重启',
      };
    }
    try {
      const res = childProcess.execSync("npx pm2 reload index_flow", {
        cwd: path.join(process.cwd()),
      })
      return {
        code: 1,
        msg: 'success'
      }
    } catch (e) {
      return {
        code: -1,
        msg: `执行出错了 ${e.message}`
      }
    }
  }

}
