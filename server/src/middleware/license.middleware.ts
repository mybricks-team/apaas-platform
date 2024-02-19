import { NextFunction, Request } from "express";
import { getDecryptLicense } from '../module/license/util'
import ConfigDao from '../dao/config.dao';
const configDao = new ConfigDao();

export function liceneseMiddleware() {
  return async (req: Request, res: any, next: NextFunction) => {
    if(req.path.includes('/paas/api/file/getMyFiles') || 
      req.path.includes('/paas/api/file/getGroupFiles')
      // req.path.includes('/paas/api/userGroup/getUserGroupRelation') ||
      // req.path.includes('/paas/api/userGroup/getGroupInfoByGroupId')
    ) {
      const licenseItem: any[] = await configDao.getConfig({
        namespace: ['system_license']
      })
      if(licenseItem?.length === 0) {
        res.json({
          code: -1,
          msg: '未激活, 清先输入激活码激活！'
        })
        return
      } else {
        const info = getDecryptLicense(licenseItem?.[0]?.config?.licenseCode)
        const { expiredDate, type } = info
        const now = new Date()
        const expired = new Date(expiredDate)
        if(expired < now) {
          res.json({
            code: -1,
            msg: 'License已过期，请重新激活！'
          })
          return
        }
      }
    }
  
    next();
  }
}
