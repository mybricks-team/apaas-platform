import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import AuthService from './auth.service';
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');
const { getConnection } = require("@mybricks/rocker-dao");

@Controller('/runtime/api/auth')
export default class AuthController {
  @Inject()
  authService: AuthService;

  // 领域建模运行时(运行时)
  @Post('/getUserAuth')
  async getUserAuth(
    @Body('params') params: any,
    @Body('projectId') projectId: number
  ) {
    let readyExePath;
    try {
      const serviceId = `SYS_AUTH`;
      const readyExeTemplateFolderPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      if (!fs.existsSync(readyExePath)) {
        return {
          code: 1,
          data: {
            openAuth: false
          },
        }
      }
      const { startExe } = require(readyExePath)
      let res = await startExe(params || {}, {
        dbConnection: await getConnection()
      })
      return {
        code: 1,
        data: {
          openAuth: true,
          data: res
        }
      }
    } catch (e) {
      return {
        code: -1,
        msg: `${typeof e === 'string' ? e : e.message}`
      }
    }
  }
}
