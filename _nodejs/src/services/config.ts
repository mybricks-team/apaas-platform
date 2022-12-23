import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import ConfigDao from "../dao/config.dao";

@Controller("/paas/api")
export default class ConfigService {
  configDao: ConfigDao;

  constructor() {
    this.configDao = new ConfigDao();
  }

  @Post("/config/get")
  async getAll(@Body("scope") scope: string[]) {
    const configList = await this.configDao.getConfig({
      namespace: scope,
    });
    const result: any = {};
    configList?.forEach((item) => {
      // @ts-ignore
      result[item.appNamespace] = item;
    });

    return {
      code: 1,
      data: result,
    };
  }

  @Post("/config/update")
  async updateConfig(
    @Body("userId") userId: string,
    @Body("config") config: any,
    @Body("namespace") namespace: string
  ) {
    const [curConfig] = await this.configDao.getConfig({
      namespace: [namespace],
    });
    if (curConfig) {
      await this.configDao.update({
        config: JSON.stringify(config),
        updatorId: userId,
        updatorName: userId,
        namespace: namespace,
      });
    } else {
      await this.configDao.create({
        creatorId: userId,
        creatorName: userId,
        config: JSON.stringify(config),
        namespace: namespace,
      });
    }

    return { code: 1 };
  }
}
