import { Request, Response, NextFunction } from 'express';

export function checkHealthMiddleware(req: Request, res: Response, next: NextFunction) {
  if ((req.method === 'HEAD' || req.method === 'GET') && (req.url === '/liveness')) {
    res.status(200).send('ok');
    return 
  }
  next();
};