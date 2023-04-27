var proxy = require('express-http-proxy');
import { NextFunction, Request, Response } from "express";

interface Option {
  proxyTarget?: string;
}

export function apiProxy(option: Option = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const url = req.url.replace('/paas/api/proxy', '');
    req.state = {
      proxy: false
    }

    if (!req.headers['x-target-host']) return await next();

    let { proxyTarget = req.headers['x-target-host'] } = option;
    const host = proxyTarget.replace(/https?\:\/\//, '');

    // 防止代理到自身，造成死循环
    if (host === req.host) return next();

    // 标识已经走代理，避免后续中间件继续执行，导致路由表找不到定义而抛出404异常
    req.state.proxy = true;

    req.headers.origin = req.headers['x-target-host'];
    req.headers.host = host;

    return proxy(proxyTarget, {
      limit: '100mb',
    });
  };
}
