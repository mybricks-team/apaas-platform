import env from "./utils/env";
import { start as startDB, shutdown as endDB } from "@mybricks/rocker-dao";

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

  process.on('SIGINT', () => {
    console.log('收到关闭信号，即将关闭资源')
    endDB().then(() => {
      console.log('数据库关闭成功')
      process.exit(0)
    }).catch((err) => {
      console.log('数据库关闭失败')
      process.exit(err ? 1 : 0)
    })
 })
}
