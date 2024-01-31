import { NextFunction, Request } from 'express';
import { Logger } from '@mybricks/rocker-commons';
const proxy = require('express-http-proxy');

export function apiProxy(req: Request, res, next: NextFunction) {
  try {
    return proxy(`localhost:${process.env.proxyPort}`, {
      preserveHostHdr: true,
      memoizeHost: false,
      limit: '500mb',
      userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
        return { ...headers, connection: 'keep-alive', 'Keep-Alive': 'timeout=5' };
      },
      proxyErrorHandler: function(err, res, next) {
        switch (err && err.code) {
          case 'ENOTFOUND': { return res.status(500).send({ statusCode: 500, message: '请求域名 DNS 解析错误，请检查请求域名配置' }); }
          case 'ECONNREFUSED': { return res.status(500).send({ statusCode: 500, message: '请求服务拒绝连接，请检查请求域名对应服务端是否正常' }); }
          case 'ECONNRESET': { return res.status(500).send({ statusCode: 500, message: 'socket hang up，请确认服务端处理逻辑是否正常' }); }
          default: {
            console.log('【主服务】 代理错误：', err, err.message);
            Logger.info(`【主服务】 代理错误：${err.message}`);
            next(err);
          }
        }
      }
    })(req, res, next);
  } catch (e) {
    return next();
  }
}
