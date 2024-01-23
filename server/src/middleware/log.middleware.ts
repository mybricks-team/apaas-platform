import { NextFunction, Request } from "express";
import { Logger } from '@mybricks/rocker-commons';
import { formatBodyOrParamsData } from "../utils/traverse";
interface Option {
  appNamespaceList?: string[];
}

export function runtimeLogger(option: Option = {}) {
  const { appNamespaceList = [] } = option;

  return async (req: Request, res, next: NextFunction) => {
    let params;
    let formattedParams = req.query;
    try {
      formattedParams = formatBodyOrParamsData(req.query);
    } catch (err) {
      formattedParams = req.query;
    }
    params = JSON.stringify(formattedParams || null);
    const application = appNamespaceList.find(namespace => req.path?.startsWith?.(`/${namespace}`)) || 'platform';

    if (req.method !== 'GET' && req.method !== 'DELETE') {
      let formattedData = req.body;
      try {
        formattedData = formatBodyOrParamsData(req.body);
      } catch (err) {
        formattedData = req.body;
      }
      params = JSON.stringify(formattedData || null);
    }

    res.on('close', () => {
      Logger.info(`[application: ${application}] [timestamp: ${new Date().toLocaleString()}] [code: ${res.statusCode}] [method: ${req.method}] [refer: ${req.headers.referer}] [userAgent: ${req.headers['user-agent']}] [params: ${params}] [path: ${req.path}] [ip: ${req.ip}]`);
    });
    next();
  };
}