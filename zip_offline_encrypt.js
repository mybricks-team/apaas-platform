const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const vm = require('vm');
const _module = require('module');
const v8 = require('v8');
v8.setFlagsFromString('--no-lazy');

const zip = new JSZip();
/** 根目录 */
const zipRootFolder = zip.folder('mybricks-apaas');
const targetConfig = process.argv[2] ? process.argv[2] : null;

// 更新版本号
const latestVersion = require('./package.json').version;
const serverPkg = require('./server/package.json');
serverPkg.version = latestVersion;
fs.writeFileSync(path.join(__dirname, './server/package.json'), JSON.stringify(serverPkg, null, 2), 'utf-8');

/** 遍历文件，添加压缩的文件
 * @param {*} zipFolder 实例
 * @param {*[]} files 支持的文件列表
 * @param {string} dirPath 当前目录
 * @param {string[]} needEncryptFiles 需要加密的文件
 */
function read (zipFolder, files, dirPath, needEncryptFiles) {
  files.forEach(function (fileName) {
    const fillPath = dirPath + '/' + fileName;
    const file = fs.statSync(fillPath);
    if (file.isDirectory()) {
      const childZipFolder = zipFolder.folder(fileName);
      const subFiles = fs.readdirSync(fillPath);
      const filterFiles = [];
      subFiles.forEach(fileName => {
        if(fileName.endsWith('.xml')) {
          if(fileName.startsWith('apaas_')) {
            filterFiles.push(fileName);
          }
        } else {
          filterFiles.push(fileName);
        }
      });
      read(childZipFolder, filterFiles, fillPath, needEncryptFiles);
    } else {
      let curFileName = fileName;
      let curFilePath = fillPath;

      if (needEncryptFiles.find(f => f === fillPath)) {
        const [compileFilePath, compileFileName] = compileFile(fillPath, fileName);
        curFileName = compileFileName;
        curFilePath = compileFilePath;
      }
      zipFolder.file(curFileName, fs.readFileSync(curFilePath));
    }
  });
}

/** 过滤不打进zip包的文件名 */
const filterFileName = [
  '.DS_Store', 
  '_apps', 
  'config',
  '.npmignore', 
  '.eslintrc.js', 
  '.prettierrc', 
  '_temp_',
  'package-lock.json', 
  'nest-cli.json',
  'application_bugu.json',
  'application.json',
  'application_hainiu.json',
  'application_fangzhou.json',
  'application_qingchenghui.json',
  'application_feiqi.json',
  'install_back.js',
  'index.html',
  'PlatformConfig_demo.json',
  'PlatformConfig_hainiu.json',
  'PlatformConfig_mybricks.json',
  'ecosystem.config.js',
  'zip_update.js',
  'encrypt.js',
  'decrypt.js',
  'compile.js',
  'zip_offline.js',
  'zip_offline_encrypt.js',
  'zip_deploy.js'
];
const needEncryptFiles = [
    'server/src/module-loader.ts',
].map(p => path.join(__dirname, p));
const filesPlatform = [];
const filesRuntime = [];
fs.readdirSync(path.join(__dirname, './server')).forEach(filename => {
  if(!filterFileName.includes(filename)) {
    filesPlatform.push(filename);
  }
});
fs.readdirSync(path.join(__dirname, './server-runtime')).forEach(filename => {
  if(!filterFileName.includes(filename) && filename !== 'node_modules') {
    filesRuntime.push(filename);
  }
});

read(zipRootFolder.folder('server'), filesPlatform, path.join(__dirname, './server'), needEncryptFiles);
read(zipRootFolder.folder('server-runtime'), filesRuntime, path.join(__dirname, './server-runtime'), needEncryptFiles);

zipRootFolder.file('upgrade_platform.sh', fs.readFileSync(path.join(__dirname, './upgrade_platform.sh')));
// if(targetConfig) {
//   zipRootFolder.folder('server').file('application.json', fs.readFileSync(path.join(__dirname, `./server/application_${targetConfig}.json`)));
// }

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: {
    level: 9
  }
}).then((content) => {
  fs.writeFileSync(path.join(__dirname, './mybricks-apaas-offline.zip'), content, 'utf-8');
});

function compileFile(filePath, fileName) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const script = new vm.Script(_module.wrap(code));
  const bytecode = script.createCachedData();
  const byteFilePath = filePath.replace(/(?<=.*)(\.[^.]+)/, '.bytecode');
  fs.writeFileSync(byteFilePath, bytecode);

  return [byteFilePath, fileName.replace(/(?<=.*)(\.[^.]+)/, '.bytecode')];
}