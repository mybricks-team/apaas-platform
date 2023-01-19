import { NestFactory } from "@nestjs/core";
import { AppModule } from "./App.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { proxyMiddleWare } from "./middleware/proxy.middleware";
import { loadModule } from "../module-loader";
import { enhanceApp } from "./enhance";
import init from "./init";
const env = require('../env.js')
const fs = require('fs-extra')

async function bootstrap() {
  const loadedModule = loadModule();
  init();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(cookieParser());

  await app.listen(3000);
}

bootstrap();
