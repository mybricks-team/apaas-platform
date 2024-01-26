import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as ws from 'ws';
import { Logger } from '@mybricks/rocker-commons';
import AppManage from './AppManage.module';
import { apiProxy } from './middleware/api.proxy.middleware';
import { getAvailablePort, isProd, startSlaveServer, stopSlaveServer } from './utils';
import { initLogger, initPM2, initSlaveConfig } from './init';
import { safeParse } from '../src/utils';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppManage);
  initLogger();
  await initPM2();
  const basePort = Number(process.env?.MYBRICKS_PLATFORM_PORT || 3100);
  process.env.masterPort = String(basePort);

  if (isProd) {
    const availablePort = await getAvailablePort(basePort + 1);
    const availableSocketPort = await getAvailablePort(basePort + 2);
    process.env.slavePort = String(availablePort);
    process.env.wsPort = String(availableSocketPort);
  } else {
    process.env.slavePort = '3101';
    process.env.wsPort = '3099';
  }

  process.env.proxyPort = process.env.slavePort;
  console.log(`【主服务】 当前代理端口：${process.env.proxyPort}`);
  Logger.info(`【主服务】 当前代理端口：${process.env.proxyPort}`);
  await initSlaveConfig({ port: Number(process.env.slavePort), masterPort: basePort, socketPort: Number(process.env.wsPort) });
  await startSlaveServer();

  try {
    const webSocketServer = new ws.Server({ port: process.env.wsPort });
    webSocketServer.on('listening', () => {
      Logger.info('主服务开始监听 socket 服务');
      console.log('主服务开始监听 socket 服务');
    });
    const slaveSocketMap = {};
    let curUpgradeInfo: any = null;

    /** 监听的是 WebSocket 服务被客户端连接上的事件 */
    webSocketServer.on('connection', (socket: ws) => {
      let slaveName = '子服务';
      /** 监听客户端发来的消息 */
      socket.on('message', async data => {
        console.log(`【主服务】 接收来自${slaveName}数据：${data}`);
        Logger.info(`【主服务】 接收来自${slaveName}数据：${data}`);
        const parsedData = safeParse(data);
        slaveName = parsedData.mode?.endsWith('_slave_backup') ? '备份子服务' : '子服务';

        if (parsedData.code === 'ready') {
          slaveSocketMap[parsedData.mode] = socket;

          if (!process.env.slaveName) {
            process.env.slaveName = parsedData.mode;
          } else {
            /** 代理端口切换到备份服务端口 */
            process.env.proxyPort = process.env.slavePort;
            console.log(`【主服务】 当前代理端口：${process.env.proxyPort}`);
            Logger.info(`【主服务】 当前代理端口：${process.env.proxyPort}`);
            await stopSlaveServer(process.env.slaveName.endsWith('_slave_backup'));
            process.env.slaveName = parsedData.mode;
          }
        } else if (parsedData.code === 'will_upgrade') {
          try {
            if (curUpgradeInfo) {
              console.log('【主服务】 子服务启动失败，停止子服务更新，错误是：当前存在服务更新的任务');
              Logger.info('【主服务】 子服务启动失败，停止子服务更新，错误是：当前存在服务更新的任务');
              return;
            }
            curUpgradeInfo = parsedData.upgradeInfo;
            const availablePort = await getAvailablePort(basePort + 1);
            /** 原有服务是 slave_backup，这新启动的服务是 slave，反之亦然 */
            const willUpgradeIsSlaveBackup = !parsedData.mode?.endsWith('_slave_backup');
            /** 启动备份服务 */
            await initSlaveConfig({
              port: availablePort,
              masterPort: basePort,
              socketPort: Number(process.env.wsPort),
              isSlaveBackup: willUpgradeIsSlaveBackup,
            });
            await startSlaveServer(willUpgradeIsSlaveBackup);
            process.env.slavePort = String(availablePort);
          } catch (e) {
            console.error(`【主服务】 备份子服务启动失败，停止子服务更新，错误是：${e}`);
            Logger.error(`【主服务】 备份子服务启动失败，停止子服务更新，错误是：${e}`);
            curUpgradeInfo = null;
          }
        }
      });

      /** 监听的是由客户端发起的关闭的事件 */
      socket.on('close', (code, reason) => {
        console.log(`【主服务】 连接已被${slaveName}(${process.env.masterProcessName}${slaveName === '子服务' ? '_slave' : '_slave_backup'})关闭，code: ${code} reason: ${reason}`);
        Logger.info(`【主服务】 连接已被${slaveName}(${process.env.masterProcessName}${slaveName === '子服务' ? '_slave' : '_slave_backup'})关闭，code: ${code} reason: ${reason}`);
      });

      /** 监听的是，WebSocket 通信过程中出错的事件 */
      socket.on('error', (error: Error) => {
        console.log(`【主服务】 ${slaveName}通信过程错误：${error}`);
        Logger.info(`【主服务】 ${slaveName}通信过程错误：${error}`);
      });
    });
  } catch (e) {
    console.log(`【主服务】 连接过程中出错，错误是：${e}`);
    Logger.info(`【主服务】 连接过程中出错，错误是：${e}`);
  }

  app.use(apiProxy)
  app.enableCors({
    origin: true,
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    methods: 'GET,PUT,POST,DELETE,UPDATE,PATCH,OPTIONS',
    credentials: true,
  });

  await app.listen(basePort);
}

bootstrap();
