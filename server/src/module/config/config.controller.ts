import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import ConfigDao from "../../dao/config.dao";
import UserService from '../user/user.service';

@Controller("/paas/api")
export default class ConfigService {
  configDao: ConfigDao;
  userService: UserService;

  constructor() {
    this.configDao = new ConfigDao();
    this.userService = new UserService()
  }

  @Post("/config/get")
  async getAll(@Body() body: { scope: string[]; type: string; id: number }) {
    const { scope, type, id } = body;

    if(scope?.length === 0) return { code: 1, data: {} };
    const allTypes = ['group'];
    const configList = await this.configDao.getConfig({
      namespace: type ? scope.reduce((pre, item) => type === 'all' ? [...pre, item, ...allTypes.map(t => `${item}@${t}[${id}]`)] : [...pre, `${item}@${type}[${id}]`], []) : scope,
    });
    const result: any = {};
    configList?.forEach((item) => {
      // @ts-ignore
      result[item.appNamespace] = item;

      if (type && type !== 'all') {
        const curNamespace = item.appNamespace.replace(`@${type}[${id}]`, '');

        result[curNamespace] = { ...item, appNamespace: curNamespace };

        delete result[item.appNamespace];
      }
    });

    return {
      code: 1,
      data: result,
    };
  }

  @Post("/config/update")
  async updateConfig(@Body() body: { userId: string; config: any; namespace: string; type: string; id: number }) {
    const { userId: originUserId, config, namespace, type, id } = body;
    const userId = await this.userService.getCurrentUserId(originUserId);
    const user = await this.userService.queryById({ id: userId });
    const curNamespace = type ? `${namespace}@${type}[${id}]` : namespace;
    const [curConfig] = await this.configDao.getConfig({ namespace: [curNamespace] });

    if (!user) {
      return { code: -1, msg: '用户不存在' };
    }

    if (curConfig) {
      await this.configDao.update({
        config: JSON.stringify(config),
        updatorId: userId,
        updatorName: user.name || user.email || userId,
        namespace: curNamespace,
      });
    } else {
      await this.configDao.create({
        creatorId: userId,
        creatorName: user.name || user.email || userId,
        config: JSON.stringify(config),
        namespace: curNamespace,
      });
    }

    return { code: 1 };
  }
}
