import {Get, Controller, Request, Res, Query} from '@nestjs/common';
import {Response} from 'express';

import * as path from 'path'
import * as fs from 'fs'
import {versionGreaterThan} from "../utils";
import UserLogDao from "../dao/UserLogDao";
import {COOKIE_LOGIN_USER} from "../constants";

@Controller('api')
export default class UpgradeService {
  userLogDao: UserLogDao

  constructor() {
    this.userLogDao = new UserLogDao()
  }

  @Get('/upgrade-check')
  check() {
    const upgradePath = path.join(process.cwd(), '../_upgrade')
    if (!fs.existsSync(upgradePath)) {
      return {
        code: -1,
        msg: 'no version info in server'
      }
    }


    const files = fs.readdirSync(upgradePath)
    if (files && files.length > 0) {
      let latestVersion

      files.sort(function (file0, file1) {
        if (file0.endsWith('.zip') && file1.endsWith('.zip')) {
          const v0 = file0.substring(0, file0.lastIndexOf('.zip')),
            v1 = file1.substring(0, file0.lastIndexOf('.zip'))
          if (versionGreaterThan(v0, v1)) {////TODO BUG
            return 1
          }
        }
        return -1
      }).find(function (file, key) {
        if (file.endsWith('.zip')) {
          latestVersion = file.substring(0, file.lastIndexOf('.zip')).replace(/_/gi, '.')
          return true
        }
      })

      if (latestVersion) {
        return {
          code: 1,
          data: {
            version: latestVersion
          }
        }
      } else {
        return {
          code: 1,
          data: {},
          msg: 'no version info in server'
        }
      }
    } else {
      return {
        code: 1,
        data: {},
        msg: 'no version info in server'
      }
    }
  }

  @Get('/upgrade-download')
  async download(@Request() req, @Query() query, @Res() res: Response) {
    if (!query.version) {
      res.status(500).json({
        code: -1,
        msg: `version expected`
      })
      return
    }

    const zipFile = path.join(process.cwd(), `../_upgrade/${query.version.replace(/\./gi, '_')}.zip`)
    if (!fs.existsSync(zipFile)) {
      res.status(500).json({
        code: -1,
        msg: `download file not found`
      })
      return
    }

    res.download(zipFile, async (err) => {
      if (!err) {
        return;
      }
      console.error(err)
      // res.send({
      //   code: -1,
      //   msg: err.message
      // })

      res.status(500).json({
        code: -1,
        msg: err.message
      })
    })
  }

  // @Get('/upgrade-download')
  // async download(@Request() req, @Query() query, @Res() res: Response) {
  //   if (!query.version) {
  //     return {
  //       code: -1,
  //       msg: `数据错误.`
  //     }
  //   }
  //
  //   const loginUser = req.cookies[COOKIE_LOGIN_USER]
  //
  //   if (loginUser) {
  //     let user
  //     try {
  //       user = JSON.parse(loginUser)
  //     } catch (ex) {
  //       return {
  //         code: -1,
  //         msg: `数据错误.`
  //       }
  //     }
  //
  //     if (user && user.id && user.email) {
  //       const zipFile = path.join(process.cwd(), `../_upgrade/${query.version.replace(/\./gi, '_')}.zip`)
  //       if (!fs.existsSync(zipFile)) {
  //         res.status(500).json({
  //           code: -1,
  //           msg: `download file not found`
  //         })
  //         return
  //       }
  //
  //       res.download(zipFile, async (err) => {
  //         if (!err) {
  //           await this.userLogDao.createUpgradeLog({
  //             userId: user.id,
  //             userEmail: user.email,
  //             logContent: `用户 ${user.email} 更新了 ${query.version}`
  //           })
  //
  //           return;
  //         }
  //         console.error(err)
  //         // res.send({
  //         //   code: -1,
  //         //   msg: err.message
  //         // })
  //
  //         res.status(500).json({
  //           code: -1,
  //           msg: err.message
  //         })
  //       })
  //     } else {
  //       return {
  //         code: -1,
  //         msg: `用户身份验证错误.`
  //       }
  //     }
  //   } else {
  //     return {
  //       code: -1,
  //       msg: `用户身份验证错误.`
  //     }
  //   }
  // }
}