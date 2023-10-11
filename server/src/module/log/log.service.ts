import { Injectable } from '@nestjs/common';
import UserLogDao from '../../dao/UserLogDao';
const fs = require('fs');
const path = require('path');
const child_process = require('child_process')
const env = require('../../../env.js')

@Injectable()
export default class LogService {

  userLogDao: UserLogDao;

  constructor() {
    this.userLogDao = new UserLogDao()
  }

  async getOperateLog(param: { limit: number, offset: number }) {
    const [total, list] = await Promise.all([
      this.userLogDao.queryTotalOfAll(),
      this.userLogDao.queryDetailOfAll(param)
    ]);
    return {
      total,
      list
    }
  }

  async _processFileLineByLine({ sourceFilePath }) {
    return new Promise((resolve, reject) => {
      const sourceFilePathReadStream = fs.createReadStream(sourceFilePath, 'utf8');
      const result = []
  
        let remaining = '';
        sourceFilePathReadStream.on('data', (chunk) => {
          let lines = (remaining + chunk).split('\n');
          remaining = lines.pop();
          lines.forEach(processLine);
        });
  
        sourceFilePathReadStream.on('end', () => {
          if (remaining) {
            processLine(remaining);
          }
          resolve(result)
        });
  
        function processLine(line) {
          if(line.indexOf('[requestPerformance]') !== -1) {
            const [a,b,c,timestamp,e,apiPath,cost] = line.match(/(?<=\[)([^\]]*)(?=\])/g)
            if(timestamp && cost && cost) {
              result.push({
                url: apiPath,
                cost: Number(cost),
                timestamp: timestamp
              })
            }
          }
        }
    })
  }

  async offlineAnalyzeInterfacePerformance() {
    const pendingFileList = []
    if(!fs.existsSync(env.LOGS_BASE_FOLDER)) {
      console.log('日志不存在')
      return
    }
    if(!fs.existsSync(env.FILE_ANALYSIS_PERFORMANCE_FOLDER)) {
      child_process.execSync(`cd ${env.FILE_LOCAL_STORAGE_FOLDER} && mkdir -p ${env.FILE_ANALYSIS_PERFORMANCE_FOLDER}`)
    }
    const alreadyList = fs.readdirSync(env.FILE_ANALYSIS_PERFORMANCE_FOLDER)
    const sourceList = fs.readdirSync(path.join(env.LOGS_BASE_FOLDER, './application'))
    
    sourceList?.forEach((item) => {
      const [a, b] = item.split('-')
      if(b) {
        const [date] = b.split('.')
        pendingFileList.push(date)
      }
    })
    for (let date of pendingFileList) {
      if(!alreadyList.includes(date)) {
        const sourceFilePath = path.join(env.LOGS_BASE_FOLDER, `./application/application-${date}.log`)
        const result = await this._processFileLineByLine({ sourceFilePath })
        fs.writeFileSync(path.join(env.FILE_ANALYSIS_PERFORMANCE_FOLDER, `./${date}.json`), JSON.stringify(result, null, 2))
      }
    }
  }

}
