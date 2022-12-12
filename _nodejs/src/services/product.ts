import {Body, Controller, Get, Post, Request} from '@nestjs/common';
import UserLogDao from "../dao/UserLogDao";
import {COOKIE_LOGIN_USER} from "../constants";

@Controller('api')
export default class ProductServices {
  userLogDao: UserLogDao

  constructor() {
    this.userLogDao = new UserLogDao()
  }

  @Get('/product/getAllDownload')
  async getAll() {
    return await this.userLogDao.queryAllDownload()
  }

  @Post('/product/download')
  async download(@Request() req, @Body() body) {
    const {version, platform} = body
    if(!version||!platform){
      return {
        code: -1,
        msg: `数据错误.`
      }
    }

    const loginUser = req.cookies[COOKIE_LOGIN_USER]

    if (loginUser) {
      let user
      try {
        user = JSON.parse(loginUser)
      } catch (ex) {
        return {
          code: -1,
          msg: `数据错误.`
        }
      }

      if (user && user.id && user.email) {
        const {version, platform} = body

        let url
        if (platform.toUpperCase().indexOf('MAC') >= 0) {
          url = 'https://ide-download.mybricks.world/enterprise/Mybricks-1.0.0.dmg'
        }
        if (platform.toUpperCase().indexOf('WIN') >= 0) {
          url = 'https://ide-download.mybricks.world/enterprise/Mybricks-1.0.0.exe'
        }


        if (!url) {
          return {
            code: -1,
            msg: `平台 ${platform} 暂不支持.`
          }
        }

        const logId = await this.userLogDao.createDownloadLog({
          userId: user.id,
          userEmail: user.email,
          logContent: `用户 ${user.email} 下载了 ${version}`
        })

        if (logId !== void 0) {
          return {
            code: 1,
            data: {////判断用户的操作系统
              url: url
            }
          }
        }
      }
    }

    return {
      code: -1,
      msg: `数据错误.`
    }
  }
}