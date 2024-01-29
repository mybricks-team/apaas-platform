import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { safeDecodeURIComponent, safeEncodeURIComponent } from '../utils';
const { APPS_BASE_FOLDER } = require('../../env');

export function assetAdapterMiddleware(req: Request, res: Response, next: NextFunction) {
  if (global.IS_PURE_INTRANET && (req.path.includes('.html') || safeDecodeURIComponent(req.path).includes('.html'))) {
    const app = global.LOADED_MODULE.namespace.find(name => req.path.startsWith(`/${name}`) || req.path.startsWith(safeEncodeURIComponent(`/${name}`)));

    let hasOffline;
    if (app) {
      const encodeNamespace = safeEncodeURIComponent(`/${app}`);
      hasOffline = fs.existsSync(
        path.join(
          APPS_BASE_FOLDER,
          req.path.replace(encodeNamespace, `${encodeNamespace}/assets`)
            .replace(`/${app}`, `/${app}/assets`)
        )
      );
    } else {
      hasOffline = fs.existsSync(path.join(process.cwd(), '_assets', req.path));
    }

    if (hasOffline) {
      req.url = req.url.replace('.html', '.offline.html');
    }
  }

  next();
}