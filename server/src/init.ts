import { start as startDB } from "@mybricks/rocker-dao";
import { Logger } from '@mybricks/rocker-commons'
import env from './utils/env';
import { initLogger } from './utils/logger';
import ConfigDao from './dao/config.dao';


export default function init() {
  initLogger()
  process.on("unhandledRejection", (e: any) => {
    Logger.info(`[global error][unhandledRejection]: \n`);
    Logger.info(e.message)
    Logger.info(e?.stack?.toString())
  });

  let dbConfig = null;
  if (env.isProd()) {
    dbConfig = require("../config/default.json");
  } else {
    dbConfig = require("../config/development.json");
  }
  startDB([
    {
      dbType: dbConfig.database.dbType,
      host: dbConfig.database.host,
      user: dbConfig.database.user,
      password: dbConfig.database.password,
      port: dbConfig.database.port,
      database: dbConfig.database.database,
      sqlPath: dbConfig.database.sqlPath,
      isGlobal: true,
      bootstrapPath: __dirname
    },
  ]);

  const configDao = new ConfigDao();
  configDao.getConfig({ namespace: ['system'] })
    .then(systemConfig => {
      const [system] = systemConfig;

      /** 初始化离线判断标识 */
      global.IS_PURE_INTRANET = (system.config as any)?.isPureIntranet;
    });
}
