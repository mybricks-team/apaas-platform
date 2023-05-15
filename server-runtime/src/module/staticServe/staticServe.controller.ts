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
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');

const PREFIX = `/${env.FILE_LOCAL_STORAGE_PREFIX_RUNTIME}`
console.log(2222, PREFIX)
@Controller(PREFIX)
export default class StaticServeController {
  @Get('*')
  async index(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // @ts-ignore
      const { pathname } = req._parsedUrl || {}
      console.log('静态资源', pathname)
      let restPart = pathname.split(PREFIX)?.[1]
      if(!restPart) {
        // @ts-ignore
        console.log('请求路径格式有误: ', req._parsedUrl)
        return {
          code: -1,
          msg: '请求路径格式有误'
        }
      }
      // 去除可能存在的最后一个/
      if(restPart[restPart.length -1] === '/') {
        restPart = restPart.slice(0, restPart.length - 1)
      }
      let absoluteFilePath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, restPart)
      if (!fs.existsSync(absoluteFilePath)) {
        // 默认后缀
        if(fs.existsSync(absoluteFilePath + '.html')) {
          return res.sendFile(absoluteFilePath + '.html')
        }
        if(restPart.startsWith('/project')) {
          // 项目空间下检测：是否为聚合页前端路由
          const parts = restPart.split('/');
          let tryPath;
          // /开头
          if(parts[0] === '') {
            tryPath = parts.splice(0, 5).join('/') // ['', 'project', '397', '395', '395', 'apps'].splice(0, 5)
          } else {
            tryPath = parts.splice(0, 4).join('/') // ['', 'project', '397', '395', '395', 'apps'].splice(0, 4)
          }
          if(fs.existsSync(path.join(env.FILE_LOCAL_STORAGE_FOLDER, tryPath + '.html'))) {
            return res.sendFile(path.join(env.FILE_LOCAL_STORAGE_FOLDER, tryPath + '.html'))
          }
        }
        return {
          code: -1,
          msg: '文件不存在'
        }
      } else {
        return res.sendFile(absoluteFilePath)
      }
    } catch(e) {
      console.log('StaticServeController:', e)
      return {
        code: -1,
        msg: e.message || '找不到相关资源'
      }
    }
  }
}
