import { NestFactory } from "@nestjs/core";
import { AppModule } from "./App.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { start as startDB } from "@mybricks/rocker-dao";
import * as config from "config";
import { proxyMiddleWare } from "./middleware/proxy.middleware";
import { loadModule } from "../module-loader";

async function bootstrap() {
  process.on("unhandledRejection", (e) => {
    console.info(`[global error]: [unhandledRejection]: ${JSON.stringify(e)}`);
  });
  const appOptions = {
    // cors: {
    //   origin: 'http://localhost:8000',
    //   credentials: true,
    // }
  };

  startDB([
    {
      dbType: config.get("database.dbType"),
      host: config.get("database.host"),
      user: config.get("database.user"),
      password: config.get("database.password"),
      port: config.get("database.port"),
      database: config.get("database.database"),
      sqlPath: config.get("database.sqlPath"),
    },
  ]);

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    appOptions
  );
  //app.setGlobalPrefix('api')
  app.useStaticAssets(path.join(__dirname, "../_assets/"), {
    prefix: "/",
    index: false
  });

  const whitelist = ["localhost", "mybricks.world"];
  app.enableCors({
    origin: function (origin, callback) {
      callback(null, true);
      // if (!origin || whitelist.find(item => origin.indexOf(item) >= 0)) {
      //   callback(null, true)
      // } else {
      //   callback(new Error('Not allowed by CORS'))
      // }
    },
    allowedHeaders:
      "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
    methods: "GET,PUT,POST,DELETE,UPDATE,OPTIONS",
    credentials: true,
  });
  app.use(
    proxyMiddleWare({
      prefixList: loadModule().namespace,
    })
  );
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(cookieParser());

  await app.listen(3000);
}

bootstrap();
