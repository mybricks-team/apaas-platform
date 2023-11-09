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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import DomainService from './domain.service';
import UploadService from '../upload/upload.service';
import {decrypt, encrypt, crypto} from '../../utils/crypto';
import SessionService from '../session/session.service';
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');
const { getConnection, DOBase, getPool } = require("@mybricks/rocker-dao");
const { SnowFlake } = require('gen-uniqueid');
import { STATUS_CODE } from '../../const';
import TransformSuccessCodeInterceptor from '../../middleware/transformSuccessCode.interceptor'

@Controller('/runtime/api/domain')
export default class FlowController {
  @Inject()
  domainService: DomainService;
  
  @Inject()
  uploadService: UploadService;
  @Inject()
  sessionService: SessionService;
  
  // runtime env
  snowFlake: any
  
  constructor() {
    this.snowFlake = new SnowFlake({ workerId: process.env.WorkerId == undefined ? 1 : process.env.WorkerId });
  }

  @Post('/test')
  async test(@Body() body: any) {
    return {
      code: 1
    }
  }

    // // 领域建模运行时(运行时)
    // @Get('/service/test')
    // async test() {
    //   let readyExePath;
    //   try {
    //     readyExePath = '/Users/andyzou/Work/registry/mybricks-team/apaas-platform/_localstorage/new.js';
    //     console.log('运行容器：readyExePath', readyExePath)
    //     const { startExe } = require(readyExePath)
    //     console.log('运行容器：获取可执行方法成功')
    //     const con = new DOBase();
    //     console.log('运行容器：获取连接成功')
    //     let res = await startExe({}, {
    //       dbConnection: con,
    //       snowFlake: this.snowFlake,
    //       axios: require('axios')
    //     })
    //     console.log('运行容器：运行完毕')
    //     return {
    //       code: 1,
    //       data: res
    //     }
    //   } catch (e) {
    //     console.log('运行容器：运行出错了', e.message)
    //     return {
    //       code: -1,
    //       msg: `${typeof e === 'string' ? e : e.message}`
    //     }
    //   }
    // }

  // 领域建模运行时(运行时)
  @Post('/service/run')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRun(
    @Body('serviceId') serviceId: string,
    @Body('params') params: any,
    @Body('fileId') fileId: number,
    @Body('projectId') projectId: number,
    @Req() req: any
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    let readyExePath;
    try {
      const sessionRes = await this.sessionService.checkUserSession(projectId, req);
      if(sessionRes?.code === STATUS_CODE.LOGIN_OUT_OF_DATE) {
        return sessionRes
      }
      const { userId } = sessionRes;
      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath)
      const { startExe } = require(readyExePath)
      console.log('运行容器：获取可执行方法成功')
      const con = new DOBase();
      const pool = getPool()
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`)
      console.log('运行容器：获取连接成功')
      let res = await startExe({
        ...(params || {}),
        _options: {
          userId,
          _headers: req.headers,
          axios: require('axios')
        }
      }, {
        dbConnection: con,
        snowFlake: this.snowFlake,
        /** 加密函数 */
        encrypt,
        decrypt,
        crypto,
      })
      console.log('运行容器：运行完毕')
      /** _CUSTOM_=true 自定义返回值 */
      return res?._CUSTOM_ ? res.data : {
        code: 1,
        data: res
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
  @Post('/service/run/:projectId/:fileId/:serviceId')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Post(
    @Body() params: any,
    @Query() query: any,
    @Param('projectId') projectId: number,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Req() req: any
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    let readyExePath;
    try {
      const sessionRes = await this.sessionService.checkUserSession(projectId, req);
      if(sessionRes?.code === STATUS_CODE.LOGIN_OUT_OF_DATE) {
        return sessionRes
      }
      const { userId } = sessionRes;
      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath)
      const { startExe } = require(readyExePath)
      console.log('运行容器：获取可执行方法成功')
      const con = new DOBase();
      const pool = getPool()
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`)
      console.log('运行容器：获取连接成功')
      let res = await startExe({
        ...(query || {}),
        ...(params || {}),
        _options: {
          userId,
          _headers: req.headers,
          axios: require('axios')
        }
      }, {
        dbConnection: con,
        snowFlake: this.snowFlake,
        /** 加密函数 */
        encrypt,
        decrypt,
        crypto,
      })
      console.log('运行容器：运行完毕')
      /** _CUSTOM_=true 自定义返回值 */
      return res?._CUSTOM_ ? res.data : {
        code: 1,
        data: res
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
  @Get('/service/run/:projectId/:fileId/:serviceId')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Get(
    @Query() params: any,
    @Param('projectId') projectId: number,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Req() req: any
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    let readyExePath;
    try {
      const sessionRes = await this.sessionService.checkUserSession(projectId, req);
      if(sessionRes?.code === STATUS_CODE.LOGIN_OUT_OF_DATE) {
        return sessionRes
      }
      const { userId } = sessionRes;
      
      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath)
      const { startExe } = require(readyExePath)
      console.log('运行容器：获取可执行方法成功')
      const con = new DOBase();
      const pool = getPool()
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`)
      console.log('运行容器：获取连接成功')
      let res = await startExe({
        ...(params || {}),
        _options: {
          userId,
          _headers: req.headers,
          axios: require('axios')
        }
      }, {
        dbConnection: con,
        snowFlake: this.snowFlake,
        /** 加密函数 */
        encrypt,
        decrypt,
        crypto,
      })
      console.log('运行容器：运行完毕')
      /** _CUSTOM_=true 自定义返回值 */
      return res?._CUSTOM_ ? res.data : {
        code: 1,
        data: res
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
  @Post('/service/run/:projectId/:fileId/:serviceId/:action')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Action_Post(
    @Body() params: any,
    @Query() query: any,
    @Param('projectId') projectId: number,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Param('action') action: string,
    @Req() req: any
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    let readyExePath;
    try {
      const sessionRes = await this.sessionService.checkUserSession(projectId, req);
      if(sessionRes?.code === STATUS_CODE.LOGIN_OUT_OF_DATE) {
        return sessionRes
      }
      const { userId } = sessionRes;

      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath)
      const { startExe } = require(readyExePath)
      console.log('运行容器：获取可执行方法成功')
      const con = new DOBase();
      const pool = getPool()
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`)
      console.log('运行容器：获取连接成功')
      let res = await startExe({
        ...(query || {}),
        ...(params || {}),
        action,
        _options: {
          userId,
          _headers: req.headers,
          axios: require('axios')
        }
      }, {
        dbConnection: con,
        snowFlake: this.snowFlake,
        /** 加密函数 */
        encrypt,
        decrypt,
        crypto,
      })
      console.log('运行容器：运行完毕')
      /** _CUSTOM_=true 自定义返回值 */
      return res?._CUSTOM_ ? res.data : {
        code: 1,
        data: res
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
  @Get('/service/run/:projectId/:fileId/:serviceId/:action')
  @UseInterceptors(new TransformSuccessCodeInterceptor(200))
  async systemDomainRunById_Action_Get(
    @Query() params: any,
    @Param('projectId') projectId: number,
    @Param('fileId') fileId: number,
    @Param('serviceId') serviceId: string,
    @Param('action') action: string,
    @Req() req: any
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    let readyExePath;
    try {
      const sessionRes = await this.sessionService.checkUserSession(projectId, req);
      if(sessionRes?.code === STATUS_CODE.LOGIN_OUT_OF_DATE) {
        return sessionRes
      }
      const { userId } = sessionRes;

      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      console.log('运行容器：readyExePath', readyExePath)
      const { startExe } = require(readyExePath)
      console.log('运行容器：获取可执行方法成功')
      const con = new DOBase();
      const pool = getPool()
      console.log(`连接池总共：${pool.config.connectionLimit}, 已用：${pool._allConnections.length}`)
      console.log('运行容器：获取连接成功')
      let res = await startExe({
        ...(params || {}),
        action,
        _options: {
          userId,
          _headers: req.headers,
          axios: require('axios')
        }
      }, {
        dbConnection: con,
        snowFlake: this.snowFlake,
        /** 加密函数 */
        encrypt,
        decrypt,
        crypto,
      })
      console.log('运行容器：运行完毕')
      /** _CUSTOM_=true 自定义返回值 */
      return res?._CUSTOM_ ? res.data : {
        code: 1,
        data: res
      }
    } catch (e) {
      console.log('运行容器：运行出错了', e.message)
      return {
        code: -1,
        msg: `${typeof e === 'string' ? e : e.message}`
      }
    }
  }
}
