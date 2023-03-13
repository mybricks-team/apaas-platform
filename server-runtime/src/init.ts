import env from "./utils/env";
import { start as startDB } from "@mybricks/rocker-dao";

export default function init() {
  process.on("unhandledRejection", (e) => {
    console.info(`[global error]: \n`);
    console.log(e);
  });

  let dbConfig = null;
  if (env.isProd()) {
    dbConfig = require("../config/default.json");
  } else {
    dbConfig = require("../config/development.json");
  }
  startDB([
    {
      dbType: dbConfig.database.dbType,
      host: dbConfig.database.host,
      user: dbConfig.database.user,
      password: dbConfig.database.password,
      port: dbConfig.database.port,
      database: dbConfig.database.database,
      sqlPath: dbConfig.database.sqlPath,
      isGlobal: true,
      bootstrapPath: __dirname
    },
  ]);
}
