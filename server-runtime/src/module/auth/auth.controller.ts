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
    @Body('userId') userId: number,
    @Body('projectId') projectId: number
  ) {
    let readyExePath;
    if(!userId || !projectId) {
      return {
        code: -1,
        msg: 'userId 或 projectId 为空'
      }
    }
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
      let res = await startExe({
        userId,
        projectId
      }, {
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

  @Post('/admin/login')
  async adminLogin(
    @Body('userName') userName: number,
    @Body('password') password: number,
    @Body('projectId') projectId: number,
  ) {
    let readyExePath;
    if(!userName || !password || !projectId) {
      return {
        code: -1,
        msg: 'userName 或 password 或 projectId 为空'
      }
    }
    try {
      const serviceId = `SYS_ADMIN_CONFIG`;
      const readyExeTemplateFolderPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.json`);
      if (!fs.existsSync(readyExePath)) {
        return {
          code: -1,
          msg: '当前项目下不存在超级管理员账号'
        }
      }
      const json = require(readyExePath)
      if(json.userName === userName && json.password === password) {
        return {
          code: 1,
          data: true,
        }
      } else {
        return {
          code: 1,
          data: false
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
