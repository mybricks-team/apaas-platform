import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
const fs = require('fs-extra');
const env = require('../../../env.js')
const path = require('path');

@Injectable()
export default class UploadService {

  fileLocalFolder = env.FILE_LOCAL_STORAGE_FOLDER

  async saveFile({
    str,
    filename,
    folderPath
  }: {
    str: string | Buffer;
    filename: string;
    folderPath?: string;
  }) {
    if(!fs.existsSync(this.fileLocalFolder)) {
      fs.mkdirSync(this.fileLocalFolder)
    }
    if(folderPath) {
      const splitedArr = folderPath?.split('/')
      let currentPath = ''
      splitedArr?.forEach(subPath => {
        if(subPath) {
          currentPath = currentPath + `/${subPath}`
          const temp = path.join(this.fileLocalFolder, currentPath)
          if(!fs.existsSync(temp)) {
            fs.mkdirSync(temp)
          }
        }
      })
    }

    let visitPath = `${this.fileLocalFolder}/${filename}`
    if(folderPath) {
      visitPath = `${this.fileLocalFolder}/${folderPath}/${filename}`
    }
    fs.writeFileSync(visitPath, str)
    return folderPath ? `${folderPath}/${filename}` : `/${filename}`
  }
}
