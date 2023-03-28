import { NestFactory } from "@nestjs/core";
import AppManage from "./AppManage.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { proxyMiddleWare } from "./middleware/proxy.middleware";
import { loadModule } from "./module-loader";
import { enhanceApp } from "./enhance";
import { checkHealthMiddleware } from './middleware/checkHealth.middleware';
import init from "./init";
import * as xmlparser from 'express-xml-bodyparser';

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
  app.use(checkHealthMiddleware);
  app.enableCors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    allowedHeaders:
      "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
    methods: "GET,PUT,POST,DELETE,UPDATE,OPTIONS",
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
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(cookieParser());
	app.use(xmlparser());

  await app.listen(
    +process.env.port ||
      +process.env.AUTO_PORT0 ||
      +process.env.AUTO_PORT1 ||
      3100,
  );
}
bootstrap();
