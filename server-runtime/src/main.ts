import { NestFactory } from "@nestjs/core";
import AppModule from "./App.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { checkHealthMiddleware } from './middleware/checkHealth.middleware';
import init from "./init";
import * as xmlparser from 'express-xml-bodyparser';

const env = require('../env.js')
const fs = require('fs-extra')

async function bootstrap() {
  init();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if(fs.existsSync(env.FILE_LOCAL_STORAGE_FOLDER)) {
    app.useStaticAssets(env.FILE_LOCAL_STORAGE_FOLDER, {
      prefix: `/${env.FILE_LOCAL_STORAGE_PREFIX_RUNTIME}`,
      index: false,
    });
  }

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
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(cookieParser());
	app.use(xmlparser());

  const port = 3101;
  await app.listen(port);
  console.log('service started at: http://localhost:' + port)
}

bootstrap();
