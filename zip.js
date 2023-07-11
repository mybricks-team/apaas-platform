const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zip = new JSZip();
/** 根目录 */
const zipRootFolder = zip.folder('mybricks-apaas');

/** 遍历文件 */
function read (zipFolder, files, dirPath) {
  files.forEach(function (fileName) {
    const fillPath = dirPath + '/' + fileName;
    const file = fs.statSync(fillPath);
    if (file.isDirectory()) {
      const childZipFolder = zipFolder.folder(fileName);
      const files = fs.readdirSync(fillPath)
      read(childZipFolder, files, fillPath);
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
  'node_modules', 
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
  'zip.js'
];
const filesPlatform = [];
const filesRuntime = [];
fs.readdirSync(path.join(__dirname, './server')).forEach(filename => {
  if(!filterFileName.includes(filename)) {
    filesPlatform.push(filename);
  }
});
fs.readdirSync(path.join(__dirname, './server-runtime')).forEach(filename => {
  if(!filterFileName.includes(filename)) {
    filesRuntime.push(filename);
  }
});

read(zipRootFolder.folder('server'), filesPlatform, path.join(__dirname, './server'));
read(zipRootFolder.folder('server-runtime'), filesRuntime, path.join(__dirname, './server-runtime'));

zipRootFolder.file('upgrade_platform.sh', fs.readFileSync(path.join(__dirname, './upgrade_platform.sh')));

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: {
    level: 9
  }
}).then((content) => {
  fs.writeFileSync(path.join(__dirname, './mybricks-apaas.zip'), content, 'utf-8');
});
