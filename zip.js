const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zip = new JSZip();
/** 根目录 */
const rootDir = zip.folder('mybricks');

/** 遍历文件 */
function read (zip, files, dirPath) {
  files.forEach(function (fileName) {
    const fillPath = dirPath + '/' + fileName;
    const file = fs.statSync(fillPath);
    if (file.isDirectory()) {
      const childDir = zip.folder(fileName);
      const files = fs.readdirSync(fillPath)
      read(childDir, files, fillPath);
    } else {
      zip.file(fileName, fs.readFileSync(fillPath));
    }
  });
}

const zipDirPath = path.join(__dirname, './server');
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
  'application_fangzhou.json',
  'application_qingchenghui.json',
  'zip.js'
];
const files = fs.readdirSync(zipDirPath).filter(filename => {
  return !filterFileName.includes(filename);
});

read(rootDir, files, zipDirPath);

zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: {
    level: 9
  }
}).then((content) => {
  fs.writeFileSync(path.join(__dirname, './mybricks.zip'), content, 'utf-8');
});
