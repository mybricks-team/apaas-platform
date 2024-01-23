import { init } from '@mybricks/rocker-commons';

import { MidLog } from 'mybricks-midlog';
import { maxAboutWord, maxLogRowContent } from '../constants';
const path = require('path');
const env = require('../../env.js')
const fs = require('fs');
const readline = require('readline');

export function initLogger() {
  MidLog.config({
    env: process.env.NODE_ENV || 'production',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vtrace: () => {},
    appender: [
      {
        type: 'TRACE',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'DEBUG',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'INFO',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'WARN',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'ERROR',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
      {
        type: 'FATAL',
        rollingFile: true,
        logdir: env.LOGS_BASE_FOLDER,
        name: 'info.log',
      },
    ],
  });

  init({
    // @ts-ignore
    Logger: () => {
      return new MidLog();
    },
  });
}

export function readLastNLines(filePath, {searchValue, numLines}: { searchValue?: string, numLines: number }) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream });

    rl.on('line', (line) => {
      // 这一行字符长度大于10000时，再去判断，内容大于24kb
      if(line.length > maxAboutWord && getStringBytes(line) > maxLogRowContent) {
        return
      }
      if(searchValue) {
        if(line.indexOf(searchValue) > -1) {
          lines.push(line);
        }
      } else {
        lines.push(line);
      }
      if (lines.length > numLines) {
        lines.shift();
        rl.close()
        fileStream.close()
        rl.removeAllListeners()
      }
    });

    rl.on('error', (err) => {
      reject(err);
    });

    rl.on('close', () => {
      resolve(lines);
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
}


/** 返回字节数 */
export function getStringBytes(str: string, encoding: BufferEncoding = 'utf-8'): number {
  const byteLengthUtf16 = Buffer.byteLength(str, encoding);
  return byteLengthUtf16
}

