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
import { assetAdapterMiddleware } from './middleware/asset.middleware';
import { TIMEOUT_TIME } from './constants';

const env = require('../env.js')

async function bootstrap() {
  const loadedModule = loadModule();
  global.LOADED_MODULE = loadedModule;
  init();

  const app = await NestFactory.create<NestExpressApplication>(AppManage);
  app.use(assetAdapterMiddleware);
  app.useStaticAssets(path.join(__dirname, "../_assets/"), {
    prefix: "/",
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
      if (path?.indexOf('.js') > -1 || path?.indexOf('.css') > -1) {
        res.set('Cache-Control', 'no-cache') // 1d
      }
    },
    etag: true,
    lastModified: true,
  });
  app.useStaticAssets(env.FILE_LOCAL_STORAGE_FOLDER, {
    prefix: `/${env.FILE_LOCAL_STORAGE_PREFIX}`,
    index: false,
    setHeaders: (res, path, stat) => {
      res.set('Access-Control-Allow-Origin', '*');
      // res.set('Cache-Control', 'max-age=86400000') // 1d
    },
    // etag: true,
    // lastModified: true,
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
  app.use(timeout(TIMEOUT_TIME))

  await app.listen(process.env?.MYBRICKS_PLATFORM_PORT || 3100);
}

bootstrap();
