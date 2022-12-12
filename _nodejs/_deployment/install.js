var http = require("http");
const fs = require('fs-extra');
const path = require('path');
const mysql = require('mysql2');
const childProcess = require('child_process');
const { clear } = require("console");

let MYSQL_CONNECTION = null
let INSTALL_SERVER = null
let UserInputConfig = {};

const _execSqlSync = (sql) => {
  return new Promise((resolve, reject) => {
    MYSQL_CONNECTION.query(
      sql,
      function (err, results, fields) {
        if(!err) {
          resolve(true)
          return true
        } else {
          reject(err)
          return false
        }
      }
    );
  })
}

async function _initDatabaseTables() {
  let dirs = fs.readdirSync(path.join(__dirname, './sql'))
  for(let l = dirs?.length, i = 0; i < l; i++) {
    const tableName = dirs?.[i]?.split('.')[0];
    const fullPath = path.join(__dirname, './sql', dirs[i]);
    const sqlStr = fs.readFileSync(fullPath, 'utf-8').toString();
    const temp = sqlStr.replace(/\n/g, '')
    await _execSqlSync(`DROP TABLE IF EXISTS \`${tableName}\`;`)
    await _execSqlSync(temp)
  }
  console.log(`【install】: 数据表初始化成功`)
}

async function _initDatabaseRecord() {
  const insertUser = `
    INSERT INTO \`${UserInputConfig.databaseName}\`.\`user\` (\`email\`, \`password\`, \`create_time\`, \`update_time\`, \`status\`, \`role\`) VALUES ('${UserInputConfig.userId}', '${Buffer.from(UserInputConfig.userPassword).toString('base64')}', ${Date.now()}, ${Date.now()}, 1, 10);
  `
  await _execSqlSync(insertUser)
  console.log(`【install】: 数据记录初始化成功`)
}

async function _initDatabase() {
  await _execSqlSync(`create database IF NOT EXISTS \`${UserInputConfig.databaseName}\` default charset utf8mb4;`)
  await _execSqlSync(`use \`${UserInputConfig.databaseName}\`;`)
  console.log(`【install】: database ${UserInputConfig.databaseName}初始化成功并使用`)
}

function connectDB() {
  try {
    MYSQL_CONNECTION = mysql.createConnection({
      host: UserInputConfig.databaseHost,
      user: UserInputConfig.databaseRootUser,
      password: UserInputConfig.databasePassword,
      port: UserInputConfig.databasePort
    });
  } catch(e) {
    console.log(e)
  }
  console.log(`【install】: 数据库连接成功`)
}

function startService() {
  childProcess.execSync(`
    npm run start
  `, {
    cwd: path.join(__dirname, '../')
  })
  console.log(`【install】: 线上服务启动成功`)
}

function stopInstall() {
  INSTALL_SERVER.close()
  console.log(`【install】: 停止安装服务成功`)
}

function exit() {
  console.log(`【install】: 安装服务已退出`)
  process.exit(1)
}

function persistenceToConfig() {
  const target = path.join(__dirname, '../config/default.json')
  const folder = path.join(__dirname, '../config')
  if(!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
  }
  const data = {
    "database": {
      "dbType": "MYSQL",
      "host": UserInputConfig.databaseHost,
      "user": UserInputConfig.databaseRootUser,
      "password": UserInputConfig.databasePassword,
      "port": UserInputConfig.databasePort,
      "database": UserInputConfig.databaseName,
      "sqlPath": "."
    }
  }
  fs.writeFileSync(target, JSON.stringify(data), 'utf-8')
  console.log(`【install】: 配置持久化成功`)
}

function installApplication() {
  childProcess.execSync(`
    node installApplication.js
  `, {
    cwd: path.join(__dirname, '../')
  })
  console.log(`【install】: 应用安装成功`)
}

async function startInstall() {
  connectDB()
  await _initDatabase()
  await _initDatabaseTables()
  await _initDatabaseRecord()
  persistenceToConfig()
  installApplication()
  stopInstall()
  startService()
}

function isInstalled() {
  const folder = path.join(__dirname, '../config')
  let flag = fs.existsSync(folder)
  return flag
}

function clearEnv() {
  try {
    const config = path.join(__dirname, '../config')
    const apps = path.join(__dirname, '../_apps')
    if(fs.existsSync(config)) {
      fs.removeSync(config)
    }
    if(fs.existsSync(apps)) {
      fs.removeSync(apps)
    }
    childProcess.execSync(`npx pm2 stop index`)
    childProcess.execSync(`npx pm2 delete index`)
  } catch(e) {
  }
}

function startInstallServer() {
  INSTALL_SERVER = http.createServer((req, res) => {
    const reqPath = req.url
    const reqMethod = req.method
    if(reqPath === '/') {
      const str = fs.readFileSync(path.join(__dirname, './install.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(str);
    } else if(reqPath === '/submitConfig' && reqMethod === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => {
        bodyStr = bodyStr + chunk.toString();
      });
      req.on('end', async () => {
        const inputConfig = JSON.parse(bodyStr);
        Object.assign(UserInputConfig, inputConfig)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        await startInstall()
        res.end(JSON.stringify({
          code: 1
        }))
        exit()
      })
    }
  })
  INSTALL_SERVER.listen(3000, () => {
    console.log("【install】本地 localhost://3000 服务已开启，请打开浏览器，输入反向代理的地址，进行后续数据库配置");
  });
}


function start() {
  clearEnv()
  const flag = isInstalled()
  if(!flag) {
    console.log(`[install] 未安装，正在执行安装操作`)
    startInstallServer()
  } else {
    console.log(`[install] 已安装，正在执行重启服务操作`)
  }
}

start()