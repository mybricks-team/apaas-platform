import { NextFunction, Request } from "express";
const proxy = require('express-http-proxy');
const URL = require('url');

interface Option {
  proxyTarget?: string;
}

export function apiProxy(option: Option = {}) {
  return async (req: Request, res, next: NextFunction) => {
    try {
      let url = req.headers['X-Target-Url'] || req.headers['x-target-url'];
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

      return proxy(url, {
        limit: '100mb',
        timeout: 10 * 1000,
        proxyReqPathResolver: req => {
          const parse = URL.parse(req.url, true);
          parse.query = { ...(parse.query || {}), ...req.query };
          let url = req.url.split('?')[0];

          if (Object.keys(parse.query).length) {
            Object.keys(req.query).forEach(key => {
              url += `${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(req.query[key])}`;
            });
          }

          return url;
        }
      })(req, res, next);
    } catch (e) {
      return next();
    }
  };
}
