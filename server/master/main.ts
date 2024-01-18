import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
const proxy = require('express-http-proxy');
import AppManage from './AppManage.module';
let proxyPort = 3101;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppManage);

  app.use('/', proxy(`localhost:${proxyPort}`, {
    preserveHostHdr: true,
    memoizeHost: false,
    limit: '500mb',
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
      return { ...headers, connection: 'keep-alive', 'Keep-Alive': 'timeout=5' };
    }
  }));

  app.enableCors({
    origin: true,
    allowedHeaders: "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
    methods: "GET,PUT,POST,DELETE,UPDATE,PATCH,OPTIONS",
    credentials: true,
  });

  await app.listen(process.env?.MYBRICKS_PLATFORM_PORT || 3100);
}

bootstrap();
