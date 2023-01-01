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

async function bootstrap() {
  const loadedModule = loadModule();
  init();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(path.join(__dirname, "../_assets/"), {
    prefix: "/",
    index: false,
  });
  enhanceApp(app, {
    appNamespaceList: loadedModule.namespace,
  });
  app.enableCors();
  app.use(
    proxyMiddleWare({
      prefixList: loadedModule.namespace,
    })
  );
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(cookieParser());

  await app.listen(3000);
}

bootstrap();
