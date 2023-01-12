const cp = require('child_process');
const fs = require('fs-extra');
const path = require('path')
const parse5 = require('parse5');
const mysql = require('mysql2');

let MYSQL_CONNECTION = null
const ENV = process.env.NODE_ENV;
const APPS_BASE_FOLDER = path.join(process.cwd(), `../_apps`);
const NPM_REGISTRY = 'https://registry.npm.taobao.org'

function injectScript({ nameSpace }) {
  const placeholder = '_NAME_SPACE_'
  const rawStr = `
  var oldxhr=window.XMLHttpRequest
  function newobj(){}
  window.XMLHttpRequest=function(){
      let tagetobk=new newobj();
      tagetobk.oldxhr=new oldxhr();
      let handle={
          get: function(target, prop, receiver) {
              if(prop==='oldxhr'){
                  return Reflect.get(target,prop);
              }
              if(typeof Reflect.get(target.oldxhr,prop)==='function')
              {
                  if(Reflect.get(target.oldxhr,prop+'proxy')===undefined)
                  {
                      target.oldxhr[prop+'proxy']=function(...funcargs){
                          let newArgs = [...funcargs]
                          try {
                              if (["GET", "POST"].indexOf(newArgs[0]) !== -1) {
                                  if(newArgs[1].indexOf("http") !== 0) {
                                    const pathname = newArgs[1];
                                    let needProxy = true;
                                    ['.js', '.css', '.html'].forEach(function (item) {
                                        if(pathname.indexOf(item) !== -1) {
                                            needProxy = false
                                        }
                                    })
                                    if(needProxy) {
                                        newArgs[1] = '${placeholder}' + newArgs[1]
                                    }
                                }
                              }
                          } catch (e) {}
                          let result=target.oldxhr[prop].call(target.oldxhr,...newArgs)
                          return result;
                      }
                  }
                  return Reflect.get(target.oldxhr,prop+'proxy')
              }
              if(prop.indexOf('response')!==-1)
              {
                  return Reflect.get(target.oldxhr,prop)
              }
              return Reflect.get(target.oldxhr,prop);
          },
          set(target, prop, value) {
              return Reflect.set(target.oldxhr, prop, value);
          },
          has(target, key) {
              // debugger;
              return Reflect.has(target.oldxhr,key);
          }
      }
      let ret = new Proxy(tagetobk, handle);
      return ret;
  };
  `
  return rawStr.replace(placeholder, `/${nameSpace}`)
}

function travelDom(domAst, { scriptStr }) {
  let headTag = domAst.childNodes?.[1]?.childNodes?.[0]
  if(headTag.nodeName === 'head') {
    let tempNode = {
      nodeName: 'script',
      tagName: 'script',
      attrs: [],
      childNodes: [
        {
          nodeName: '#text',
          value: scriptStr
        }
      ],
      parentNode: headTag
    }
    headTag.childNodes.push(tempNode)
  }
}

async function installApplication() {
  return new Promise(async (resolve, reject) => {
    const applicationLoadConfigPath = path.join(process.cwd(), './application.json');
    if(fs.existsSync(applicationLoadConfigPath)) {
      const applicationLoadConfig = require(applicationLoadConfigPath)
      const installApps = applicationLoadConfig?.installApps
      for(let l = installApps.length, i = 0; i < l; i++) {
        const appConfig = installApps[i];
        if(appConfig.type === 'npm') {
          const npmPkg = appConfig.path;
          const pkgName = npmPkg.split('@')[0]
          const pkgVersion = npmPkg.split('@')[1]
          if(!fs.existsSync(APPS_BASE_FOLDER)) {
            fs.mkdirSync(APPS_BASE_FOLDER)
          }
          const destAppDir = path.join(APPS_BASE_FOLDER, `./${pkgName}`)
          if(!fs.existsSync(APPS_BASE_FOLDER)) {
            fs.mkdirSync(APPS_BASE_FOLDER)
          }
          // judge jump
          const existedAppPkgPath = path.join(destAppDir, './package.json')
          if(fs.existsSync(existedAppPkgPath)) {
            const existedAppPkg = require(existedAppPkgPath);
            if(existedAppPkg?.version === pkgVersion) {
              console.log(`【install】: 应用 ${npmPkg} 已安装，跳过...`)
              continue
            }
          }
          console.log(`【install】: 应用 ${npmPkg} 正在加载中...`)
          const tempFolder = destAppDir + '_temp';
          try{
            if(!fs.existsSync(tempFolder)) {
              fs.mkdirSync(tempFolder)
              fs.writeFileSync(tempFolder + '/package.json', JSON.stringify({}), 'utf-8')
            } else {
              fs.removeSync(tempFolder)
              fs.mkdirSync(tempFolder)
              fs.writeFileSync(tempFolder + '/package.json', JSON.stringify({}), 'utf-8')
            }
            cp.execSync(`cd ${tempFolder} && npm i --registry=${NPM_REGISTRY} ${npmPkg}`)
          } catch(e) {
            console.log(`【install】: 应用 ${npmPkg} 安装失败，跳过...`)
            console.log(`【install】: 错误是: ${e.toString()}`)
            fs.removeSync(tempFolder)
            continue;
          }
          // copy aplication
          const srcAppDir = path.join(tempFolder, `./node_modules/${pkgName}`)
          fs.copySync(srcAppDir, destAppDir)
          const pkgPath = path.join(destAppDir, './package.json');
          if(fs.existsSync(pkgPath)) {
            const pkg = require(pkgPath);
            if(typeof pkg === "object") {
              // copy xml
              const bePath = path.join(destAppDir, './nodejs')
              const fePath = path.join(destAppDir, './assets')
              if(fs.existsSync(bePath)) {
                // 存在后端
                if(fs.existsSync(path.join(bePath, './mapper'))) {
                  // 存在mapper
                  fs.copySync(path.join(bePath, './mapper'), path.join(process.cwd(), `./src/dao`))
                }
              }
              if(fs.existsSync(fePath)) {
                // 存在前端
                const srcHomePage = path.join(fePath, './index.html') // 约定
                const rawHomePageStr = fs.readFileSync(srcHomePage, 'utf-8')
                let handledHomePageDom = parse5.parse(rawHomePageStr);
                travelDom(handledHomePageDom, {
                  scriptStr: injectScript({
                    nameSpace: pkg.name ? pkg.name : ''
                  })
                })
                let handledHomePageStr = parse5.serialize(handledHomePageDom)
                fs.writeFileSync(srcHomePage, handledHomePageStr, 'utf-8')
                console.log(`【install】: 资源准备完毕 ${npmPkg}`)
              }
              // exec hooks
              if(pkgPath?.mybricks?.preInstall) {
                prepareEnv()
                setTimeout(async () => {
                  await execJs({
                    jsPath: path.join(destAppDir, pkgPath.mybricks.preInstall)
                  })
                }, 100)
              }
            }
            fs.removeSync(tempFolder)
          }
        }
      }
    }
    console.log(`【install】: 应用安装成功，可以启动 `)
    resolve()
  })
}

function prepareEnv() {
  if(!MYSQL_CONNECTION) {
    const dbConfig = require("./config/default.json");
    MYSQL_CONNECTION = mysql.createConnection({
      host: dbConfig.database.host,
      user: dbConfig.database.user,
      database: dbConfig.database.database,
      password: dbConfig.database.password,
      port: dbConfig.database.port
    });
    console.log(`【install】: 可执行环境准备完毕 `)
  }
}

const execSql = (sql) => {
  return new Promise((resolve, reject) => {
    MYSQL_CONNECTION.query(
      sql,
      function (err, results, fields) {
        if(!err) {
          // console.log(results);
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

const closeConnection = () => {
  if(MYSQL_CONNECTION && MYSQL_CONNECTION.end) {
    try {
      MYSQL_CONNECTION.end((err) => {
        if(err) {
          return console.log('数据库关闭失败:' + err.message);
        }
        console.log(`【install】: 数据库已释放 `)
      })
    } catch(e) {
      console.log(e)
    }
  }
}

async function execJs({ jsPath }) {
  const loadScript = require(jsPath)
  await loadScript({
    execSql: execSql
  })
}

function destroyEnv() {
  closeConnection();
  setTimeout(() => {
    MYSQL_CONNECTION = null;
    console.log(`【install】: 可执行环境已释放 `)
  }, 500)
}

installApplication()
  .then(() => {
    destroyEnv()
  })
  .catch(e => {
    console.log(e)
  })
