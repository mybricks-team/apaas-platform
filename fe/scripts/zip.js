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

const zipDirPath = path.join(__dirname, '../_nodejs');
/** 过滤不打进zip包的文件名 */
const filterFileName = ['.DS_Store', '_apps', 'config', 'node_modules', '.npmignore', 'package-lock.json'];
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
  fs.writeFileSync(path.join(zipDirPath, '../mybricks.zip'), content, 'utf-8');
});
