import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  Req,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import AuthService from './auth.service';
import { genMainIndexOfDB } from '../../utils';
import { decrypt, encrypt } from '../../utils/crypto';
import SessionService from "../session/session.service";
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');
const { getConnection, DOBase, getPool } = require("@mybricks/rocker-dao");

@Controller('/runtime/api/auth')
export default class AuthController {
  @Inject()
  authService: AuthService;
  @Inject()
  sessionService: SessionService;

  // 老代码，逐步废弃，暂时不删
  _getSysAuthInfo_old(projectId: number) {
    let data: any = {
      result: false,
      pcPageIdList: []
    }
    try {
      const projectInfo = require(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/PROJECT_INFO.json`));
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
        }
      }
    } catch(e) {
      console.log(e)
    }
    return data
  }

  _getSysAuthInfo(projectId: number) {
    let data: any = {
      result: false,
      pcPageIdList: []
    }
    try {
      const files = fs.readdirSync(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`))
      // 判断系统表
      files.forEach(fileName => {
        if(/DOMAIN_META_/.test(fileName)) {
          const fileContent = require(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileName}`))
          fileContent?.entityAry?.forEach(entity => {
            if(entity.isSystem) {
              data.result = true
            }
          })
        }
      })
      if(data.result) {
        // 获取全量页面
        files.forEach(fileName => {
          // 非文件，只取文件夹，性能考虑不用方法判断
          if(
            fileName.indexOf('.js') === -1 &&
            fileName.indexOf('.json') === -1 &&
            fileName.indexOf('.html') === -1
          ) {
            const childFiles = fs.readdirSync(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileName}`))
            childFiles?.forEach(childFileName => {
              if(childFileName.indexOf('.html') !== -1) {
                data.pcPageIdList.push(childFileName?.split('.html')?.[0])
              }
            })
          }
        })
      }
    } catch(e) {
      console.log(e)
    }
    return data
  }

  // 领域建模运行时(运行时)
  @Post('/getUserAuth')
  async getUserAuth(
    @Body('userId') uid: number,
    @Body('projectId') projectId: number,
    @Req() req: any
  ) {
    let readyExePath;
    const userId = req?.headers?.username || uid;
    if(!userId || !projectId) {
      return {
        code: -1,
        msg: 'userId 或 projectId 为空'
      }
    }
    try {
      const sessionRes = await this.sessionService.checkUserSession(projectId, req);
      if(sessionRes?.code === 100001) {
        return sessionRes
      }
      if(sessionRes?.isSuperAdmin) {
        // 只返回权限模块
        const res = this._getSysAuthInfo(projectId)
        return {
          code: 1,
          data: {
            openAuth: res.openAuth,
            角色权限: res.pcPageIdList.join(',')
          }
        }
      }

      const serviceId = `SYS_AUTH`;
      const readyExeTemplateFolderPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath)
      if (!fs.existsSync(readyExePath)) {
        return {
          code: 1,
          data: {
            openAuth: false
          },
        }
      }
      const { startExe } = require(readyExePath)
      console.log('运行容器：获取可执行方法成功')
      const con = new DOBase();
      console.log('运行容器：获取连接成功')
      const pool = getPool()
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`)
      let res = await startExe({ userId, projectId }, { dbConnection: con, encrypt, decrypt });
      console.log('运行容器：运行完毕')
      return {
        code: 1,
        data: {
          openAuth: true,
          data: res
        }
      }
    } catch (e) {
      console.log('运行容器：运行出错了', e.message)
      return {
        code: -1,
        msg: `${typeof e === 'string' ? e : e.message}`
      }
    }
  }

  // 领域建模运行时(运行时)
  @Post('/login')
  async login(
    @Body() body: Record<string, unknown>,
    @Req() req: any,
    @Res({ passthrough: true }) response: Response
  ) {
    let readyExePath;
    if(!body.projectId) {
      return { code: -1, msg: 'projectId 为空' };
    }
    try {
      const serviceId = `LOGIN`;
      const readyExeTemplateFolderPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${body.projectId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath);
			
      if (!fs.existsSync(readyExePath)) {
        return { code: -1, msg: '登录失败' };
      }
			
      const { startExe } = require(readyExePath);
      console.log('运行容器：获取可执行方法成功');
      const con = new DOBase();
      console.log('运行容器：获取连接成功');
      const pool = getPool();
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`);
      let res = await startExe(body, { dbConnection: con, genUniqueId: genMainIndexOfDB, encrypt, decrypt });
      console.log('运行容器：运行完毕', res?.凭证);
      if(res?.凭证) {
        response.cookie('token', res?.凭证, {
          path: '/runtime/api',
          httpOnly: true,
          maxAge: 1000 * 24 * 60 * 60 * 1000,
          secure: true,
          sameSite: 'Lax'
        })
        delete res?.凭证
      }
			
      return res ? { code: 1, data: res } : { code: -1, msg: '用户名或密码不正确' };
    } catch (e) {
      console.log('运行容器：运行出错了', e.message);
      return { code: -1, msg: `${typeof e === 'string' ? e : e.message}` };
    }
  }
	
  // 领域建模运行时(运行时)
  @Post('/register')
  async register(
    @Body() body: Record<string, unknown>,
    @Req() req: any,
    @Res({ passthrough: true }) response: Response
  ) {
    let readyExePath;
    if(!body.projectId) {
      return { code: -1, msg: 'projectId 为空' };
    }
    if(!body.username || !body.password) {
      return { code: -1, msg: '用户名、密码为空' };
    }
		
    try {
      const serviceId = `REGISTER`;
      const readyExeTemplateFolderPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${body.projectId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath);
	    
      if (!fs.existsSync(readyExePath)) {
	      return {code: -1, msg: '注册失败'};
      }

      const files = fs.readdirSync(readyExeTemplateFolderPath);
      const entityFile = files?.find(file => {
        return file.startsWith('DOMAIN_META') && file.endsWith('.json');
      });
      const entity = entityFile ? require(path.join(readyExeTemplateFolderPath, entityFile)) : null;

      const { startExe } = require(readyExePath);
      console.log('运行容器：获取可执行方法成功');
      const con = new DOBase();
      console.log('运行容器：获取连接成功');
      const pool = getPool();
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`);
      let res = await startExe(body, { dbConnection: con, genUniqueId: genMainIndexOfDB, entity, encrypt, decrypt });
      console.log('运行容器：运行完毕');
      if(res?.凭证) {
        response.cookie('token', res?.凭证, {
          path: '/runtime/api',
          httpOnly: true,
          maxAge: 1000 * 24 * 60 * 60 * 1000,
          secure: true,
          sameSite: 'Lax'
        })
        delete res?.凭证
      }
      return res ? { code: 1, data: res } : { code: -1, msg: '注册失败' };
    } catch (e) {
      console.log('运行容器：运行出错了', e.message);
      return { code: -1, msg: `${typeof e === 'string' ? e : e.message}` };
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

  // 存量保留，新增的走表中数据，逐步废弃
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
