import { init } from '@mybricks/rocker-commons';

import { MidLog } from 'mybricks-midlog';
const path = require('path');
const logDir = path.join(__dirname, '../../../logs');

export function initLogger() {
  MidLog.config({
    env: process.env.NODE_ENV || 'dev',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vtrace: () => {},
    appender: [
      {
        type: 'TRACE',
        rollingFile: true,
        logdir: logDir,
        name: 'info.log',
      },
      {
        type: 'DEBUG',
        rollingFile: true,
        logdir: logDir,
        name: 'info.log',
      },
      {
        type: 'INFO',
        rollingFile: true,
        logdir: logDir,
        name: 'info.log',
      },
      {
        type: 'WARN',
        rollingFile: true,
        logdir: logDir,
        name: 'info.log',
      },
      {
        type: 'ERROR',
        rollingFile: true,
        logdir: logDir,
        name: 'info.log',
      },
      {
        type: 'FATAL',
        rollingFile: true,
        logdir: logDir,
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
