import { Logger } from '@mybricks/rocker-commons'
import { start as startDB } from '@mybricks/rocker-dao';
import env from './utils/env';
import { initLogger } from './utils/logger';
import ConfigDao from './dao/config.dao';
const ws = require('ws');


export default function init() {
  initLogger()
  process.on('unhandledRejection', (e: any) => {
    Logger.info(`[global error][unhandledRejection]: \n`);
    Logger.info(e.message)
    Logger.info(e?.stack?.toString())
  });

  let dbConfig;
  if (env.isProd()) {
    dbConfig = require('../config/default.json');
  } else {
    dbConfig = require('../config/development.json');
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
  if (!process.env?.MYBRICKS_PLATFORM_MASTER_NAME) {
    process.env.MYBRICKS_PLATFORM_MASTER_NAME = 'index';
  }
  if (!process.env?.MYBRICKS_NODE_MODE) {
    process.env.MYBRICKS_NODE_MODE = process.env.MYBRICKS_PLATFORM_MASTER_NAME + '_slave';
  }

  const slaveName = process.env?.MYBRICKS_NODE_MODE?.endsWith('_slave_backup') ? '备份子服务' : '子服务';

  try {
    const webSocketClient = new ws(`ws://127.0.0.1:${process.env?.MYBRICKS_PLATFORM_MASTER_WS_PORT || 3099}`);

    webSocketClient.on('open', () => {
      console.log(`【${slaveName}】 已连接到主服务`);
      Logger.info(`【${slaveName}】 已连接到主服务`);

      webSocketClient.send(JSON.stringify({ mode: process.env.MYBRICKS_NODE_MODE, code: 'ready' }));
      global.WEB_SOCKET_CLIENT = webSocketClient;
    });

    webSocketClient.on('message', (data) => {
      console.log(`【${slaveName}】 接收来自主服务数据：${data}`);
      Logger.info(`【${slaveName}】 接收来自主服务数据：${data}`);
    });

    webSocketClient.on('error', (error: Error) => {
      console.log(`【${slaveName}】 通信过程错误：${error}`);
      Logger.info(`【${slaveName}】 通信过程错误：${error}`);
    });

    webSocketClient.on('close', () => {
      console.log(`【${slaveName}】 连接已被主服务关闭`);
      Logger.info(`【${slaveName}】 连接已被主服务关闭`);
    });
  } catch (e) {
    console.log(`【${slaveName}】 连接过程中出错，错误是：${e}`);
    Logger.info(`【${slaveName}】 连接过程中出错，错误是：${e}`);
  }

  const configDao = new ConfigDao();
  configDao.getConfig({ namespace: ['system'] })
    .then(systemConfig => {
      const [system] = systemConfig;

      /** 初始化离线判断标识 */
      global.IS_PURE_INTRANET = (system.config as any)?.isPureIntranet;
    });
}
