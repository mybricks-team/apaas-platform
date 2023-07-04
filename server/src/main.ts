import { NestFactory } from "@nestjs/core";
import AppManage from "./AppManage.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { HttpException, ValidationPipe } from '@nestjs/common';

import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import * as xmlparser from 'express-xml-bodyparser';

import { proxyMiddleWare } from "./middleware/proxy.middleware";
import { timeout } from "./middleware/requestTimeout.middleware";
import { checkHealthMiddleware } from './middleware/checkHealth.middleware';

import { loadModule } from "./module-loader";
import { enhanceApp } from "./enhance";
import init from "./init";

const env = require('../env.js')
const fs = require('fs-extra')

async function bootstrap() {
  const loadedModule = loadModule();
  init();

  const app = await NestFactory.create<NestExpressApplication>(AppManage);
  app.useStaticAssets(path.join(__dirname, "../_assets/"), {
    prefix: "/",
    index: false,
  });
  if(fs.existsSync(env.FILE_LOCAL_STORAGE_FOLDER)) {
    app.useStaticAssets(env.FILE_LOCAL_STORAGE_FOLDER, {
      prefix: `/${env.FILE_LOCAL_STORAGE_PREFIX}`,
      index: false,
    });
  }

  enhanceApp(app, {
    appNamespaceList: loadedModule.namespace,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors = []) => {
        throw new HttpException(Object.values(validationErrors?.[0]?.constraints)?.[0], -1);
      },
    }),
  );
  app.use(checkHealthMiddleware);

  // app.enableCors({
  //   origin: (req: any, callback) => {
  //     var corsOptions;
  //     if ([].indexOf(req?.header?.('Origin')) !== -1) {
  //       corsOptions = { origin: true }
  //     } else {
  //       corsOptions = { origin: false }
  //     }
  //     callback(null, corsOptions)
  //   },
  //   allowedHeaders:
  //     "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
  //   methods: "GET,PUT,POST,DELETE,UPDATE,OPTIONS",
  //   credentials: true,
  // })

  app.use(
    proxyMiddleWare({
      namespaceMap: loadedModule.namespaceMap,
    })
  );
  loadedModule?.middleware?.forEach(m => {
    app.use(m);
  })
  loadedModule?.interceptor?.forEach(i => {
    app.useGlobalInterceptors(
      new i(),
    );
  })
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(cookieParser());
	app.use(xmlparser());
  app.use(timeout(10 * 1000))

  await app.listen(3100);
}

bootstrap();
