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
  constructor() {
  }
  
  // 领域建模运行时(运行时)
  @Post('/reload')
  async systemDomainRun() {
    try {
      childProcess.exec(
        "npx pm2 reload index_flow",
        {
          cwd: path.join(process.cwd()),
        },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
          
        }
      );
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
