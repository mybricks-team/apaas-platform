import { NextFunction, Request } from "express";
import { Logger } from '@mybricks/rocker-commons';
import { maxLogRowContent, maxAboutWord } from '../constants';
import { getStringBytes } from '../utils/logger'
interface Option {
  appNamespaceList?: string[];
}

export function runtimeLogger(option: Option = {}) {
  const { appNamespaceList = [] } = option;

  return async (req: Request, res, next: NextFunction) => {
    let params = JSON.stringify(req.query || null);
    const application = appNamespaceList.find(namespace => req.path?.startsWith?.(`/${namespace}`)) || 'platform';

    if (req.method !== 'GET' && req.method !== 'DELETE') {
      params = JSON.stringify(req.body || null);
    }
    // TODO:这里加了判断达到一定长度后，再看占用多少字节，看下是否需要
    if(params.length > maxAboutWord && getStringBytes(params) > maxLogRowContent) {
      params = '参数过长，无法展示'
    }

    res.on('close', () => {
      Logger.info(`[application: ${application}] [timestamp: ${new Date().toLocaleString()}] [code: ${res.statusCode}] [method: ${req.method}] [refer: ${req.headers.referer}] [userAgent: ${req.headers['user-agent']}] [params: ${params}] [path: ${req.path}] [ip: ${req.ip}]`);
    });
    next();
  };
}