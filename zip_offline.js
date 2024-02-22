const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const childProcess = require('child_process');

childProcess.execSync('mv ./server/src ./server/temp')
childProcess.execSync('mv ./server/dist ./server/src')

const zip = new JSZip();
/** 根目录 */
const zipRootFolder = zip.folder('mybricks-apaas');
const targetConfig = process.argv[2] ? process.argv[2] : null;

// 更新版本号
const latestVersion = require('./package.json').version;
const serverPkg = require('./server/package.json');
serverPkg.version = latestVersion;
fs.writeFileSync(path.join(__dirname, './server/package.json'), JSON.stringify(serverPkg, null, 2), 'utf-8');

/** 遍历文件 */
function read (zipFolder, files, dirPath) {
  files.forEach(function (fileName) {
    const fillPath = dirPath + '/' + fileName;
    const file = fs.statSync(fillPath);
    if (file.isDirectory()) {
      const childZipFolder = zipFolder.folder(fileName);
      const subFiles = fs.readdirSync(fillPath)
      const filterFiles = []
      subFiles.forEach(fileName => {
        if(fileName.endsWith('.xml')) {
          if(fileName.startsWith('apaas_')) {
            filterFiles.push(fileName)
          }
        } else {
          filterFiles.push(fileName)
        }
      })
      read(childZipFolder, filterFiles, fillPath);
    } else {
      zipFolder.file(fileName, fs.readFileSync(fillPath));
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
  'license-private.pem',
  'license.js',
  'dist',
  'temp',
  'zip_update.js',
  'zip_offline.js',
  'zip_deploy.js'
];
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

read(zipRootFolder.folder('server'), filesPlatform, path.join(__dirname, './server'));
read(zipRootFolder.folder('server-runtime'), filesRuntime, path.join(__dirname, './server-runtime'));

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
  childProcess.execSync('rm -rf ./server/src')
  childProcess.execSync('mv ./server/temp ./server/src')
});