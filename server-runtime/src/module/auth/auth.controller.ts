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
const { getConnection, DOBase } = require("@mybricks/rocker-dao");

@Controller('/runtime/api/auth')
export default class AuthController {
  @Inject()
  authService: AuthService;


  _getSysAuthInfo(projectId: number) {
    let data: any = {
      result: false,
      pcPageIdList: []
    }
    try {
      const projectInfo = require(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/PROJECT_INFO.json`));
      let fileIdMap = {}
      for(let key in projectInfo) {
        const item = projectInfo[key]
        if(item['isModule']) {
          for(let key2 in item) {
            const fileInfo = item[key2];
            if(fileInfo.implementSysAuth) {
              data.result = true
            }
            // 实现了系统表
            if(data?.result && fileInfo.extName === 'html') {
              data.pcPageIdList.push(key2)
            }
          }
          
        } else {
          fileIdMap[key] = item
        }
      }
    } catch(e) {
      console.log(e)
    }
    return data
  }

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
      const sysAdminConfig = await this._getSysAdminConfig(projectId);
      if(sysAdminConfig) {
        // 判断是不是超管登陆
        if(sysAdminConfig.userName === userId) {
          // 只返回权限模块
          const res = this._getSysAuthInfo(projectId)
          if(res?.result) {
            return {
              code: 1,
              data: {
                openAuth: true,
                data: [
                  {
                    角色权限: res.pcPageIdList.join(',')
                  }
                ]
              }
            }
          } else {
            return {
              code: 1,
              data: {
                openAuth: true,
                data: [
                  {
                    角色权限: ''
                  }
                ]
              }
            }
          }
        }
      }

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
      const con = new DOBase();
      let res = await startExe({
        userId,
        projectId
      }, {
        dbConnection: con
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

  async _getSysAdminConfig(projectId) {
    const serviceId = `SYS_ADMIN_CONFIG`;
    const readyExeTemplateFolderPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`);
    const readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.json`);
    if (!fs.existsSync(readyExePath)) {
      return null
    }
    const json = require(readyExePath)
    return json
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
      const json = await this._getSysAdminConfig(projectId);
      if (!json) {
        return {
          code: -1,
          msg: '当前项目下不存在超级管理员账号'
        }
      }
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
