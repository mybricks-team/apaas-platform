import { Request, Response, NextFunction } from 'express';
import { Logger } from '@mybricks/rocker-commons';

export function requestPerformance(req: Request, res: Response, next: NextFunction) {
  if (req.url === '/' || req.url === '/liveness') {
    return next()
  }
  // @ts-ignore
  req._startTime = Date.now()
  let calResponseTime = function () {
    // @ts-ignore
    if (req._endTime) {
      return;
    }
    // @ts-ignore
    var deltaTime = Date.now() - req._startTime;
    // @ts-ignore
    req._endTime = Date.now();
    if(req.url?.indexOf('/paas/api') > -1) {
      Logger.info(`[requestPerformance]: [${new Date().toLocaleString()}]: [${req.method}] [${req.path}] [${deltaTime}] ms`);
    }
  }
  res.once('finish', calResponseTime);
  res.once('close', calResponseTime);
  return next();
};