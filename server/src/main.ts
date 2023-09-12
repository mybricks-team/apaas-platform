import { NestFactory } from "@nestjs/core";
import AppManage from "./AppManage.module";
import { NestExpressApplication } from "@nestjs/platform-express";

import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import * as xmlparser from 'express-xml-bodyparser';

import { proxyMiddleWare } from "./middleware/proxy.middleware";
import { apiProxy as apiProxyMiddleWare } from './middleware/api.proxy.middleware';
import { timeout } from "./middleware/requestTimeout.middleware";
import { checkHealthMiddleware } from './middleware/checkHealth.middleware';

import { loadModule } from "./module-loader";
import { enhanceApp } from "./enhance";
import init from "./init";
import ValidationPipe from "./pipe/validationPipe";
import { runtimeLogger } from './middleware/log.middleware';

const env = require('../env.js')

async function bootstrap() {
  const loadedModule = loadModule();
  init();

  const app = await NestFactory.create<NestExpressApplication>(AppManage);
  app.useStaticAssets(path.join(__dirname, "../_assets/"), {
    prefix: "/",
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
    }
  });
  app.useStaticAssets(env.FILE_LOCAL_STORAGE_FOLDER, {
    prefix: `/${env.FILE_LOCAL_STORAGE_PREFIX}`,
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
    }
  });
  app.use(apiProxyMiddleWare());
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(runtimeLogger({
    appNamespaceList: loadedModule.namespace,
  }));

  enhanceApp(app, {
    appNamespaceList: loadedModule.namespace,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(checkHealthMiddleware);

  app.enableCors({
    // origin: [],
    origin: true,
    allowedHeaders: "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
    methods: "GET,PUT,POST,DELETE,UPDATE,PATCH,OPTIONS",
    credentials: true,
  });

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
  app.use(cookieParser());
	app.use(xmlparser());
  app.use(timeout(10 * 1000))

  await app.listen(3100);
}

bootstrap();
