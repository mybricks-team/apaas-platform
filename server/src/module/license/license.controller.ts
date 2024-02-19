import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import ConfigDao from "../../dao/config.dao";
import UserService from '../user/user.service';
import { getDecryptLicense } from './util'

@Controller("/paas/api/license")
export default class ConfigService {
  configDao: ConfigDao;
  userService: UserService;

  constructor() {
    this.configDao = new ConfigDao();
    this.userService = new UserService()
  }

  @Post("/activate")
  async activateLicense(@Body() body: { userId: string, licenseCode: string }) {
    const { licenseCode } = body;
    try {
      console.log('licenseCode', licenseCode)
      getDecryptLicense(licenseCode)

      const existItem = await this.configDao.getConfig({
        namespace: ['system_license'],
      });
      const user = await this.userService.queryById({ id: body.userId });
      if(existItem?.length === 0) {
        await this.configDao.create({
          creatorId: body.userId,
          creatorName: user.name || user.email || body.userId,
          config: JSON.stringify({ licenseCode }),
          namespace: 'system_license'
        });
        return {
          code: 1,
          msg: '激活成功！'
        }
      } else {
        await this.configDao.update({
          config: JSON.stringify({ licenseCode }),
          updatorId: body.userId,
          updatorName: user.name || user.email || body.userId,
          namespace: 'system_license',
        });
        return {
          code: 1,
          msg: 'License更新成功！'
        }
      }
    } catch (e) {
      console.log(e)
      return {
        code: -1,
        msg: '激活失败，无效秘钥！',
      }
    }
  }

  @Post('/getActivateInfo')
  async getActivateInfo() {
    const HANS_MAP = {
      'personal': '个人版',
    }
    try {
      const existItem: any[] = await this.configDao.getConfig({
        namespace: ['system_license'],
      });
      if(existItem?.length === 0) {
        return {
          code: -1,
          msg: '未激活'
        }
      } else {
        const infoObj = getDecryptLicense(existItem[0]?.config?.licenseCode)

        return {
          code: 1,
          data: {
            type: HANS_MAP[infoObj.type],
            expiredDate: infoObj.expiredDate,
            status: new Date(infoObj.expiredDate) < new Date() ? '已失效' : '已激活'
          }
        }
      }
    } catch(e) {
      console.log(e)
      return {
        code: -1,
        msg: '获取激活信息失败！'
      }
    }
    
  }

}
