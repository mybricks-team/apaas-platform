import { NextFunction, Request } from "express";
const proxy = require('express-http-proxy');

interface Option {
  proxyTarget?: string;
}

export function apiProxy(option: Option = {}) {
  return async (req: Request, res, next: NextFunction) => {
    try {
      const url = req.headers['X-Target-Url'] || req.headers['x-target-url'];
      const regex = /(?:https?:\/\/)?(?:www\.)?([^\/]+)/;
      const host = url?.match?.(regex)?.[1];

      if (!/(?:\/[^\/]*)?\/paas\/api\/proxy/.test(req.path) || !url || !host) {
        return next();
      }
      /** 防止代理到自身，造成死循环 */
      if (host === req.hostname) return next();

      const origin = url.match(/(https?:\/\/)?(?:www\.)?([^\/]+)/)?.[0];
      req.url = url.replace(origin, '');
      req.headers.origin = origin;
      req.headers.host = host;

      return proxy(url, { limit: '100mb' })(req, res, next);
    } catch (e) {
      return next();
    }
  };
}
