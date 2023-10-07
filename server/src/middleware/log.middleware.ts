import { NextFunction, Request } from "express";
import { Logger } from '@mybricks/rocker-commons';

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

    res.on('close', () => {
      Logger.info(`[application: ${application}] [timestamp: ${new Date().toLocaleString()}] [code: ${res.statusCode}] [method: ${req.method}] [refer: ${req.headers.referer}] [userAgent: ${req.headers['user-agent']}] [params: ${params}] [path: ${req.path}] [ip: ${req.ip}]`);
    });
    next();
  };
}