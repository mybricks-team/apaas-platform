import * as path from "path";
import env from "./utils/env";

export function enhanceApp(app: any, config: { appNamespaceList: string[] }) {
  config?.appNamespaceList?.forEach(ns => {
    const baseFolder = env.getAppInstallFolder()
    // ns切割
    if(ns?.indexOf('/') > -1){
      app.useStaticAssets(path.join(baseFolder, `/${encodeURIComponent(ns)}/assets/`), {
        prefix: `/${ns}`,
        index: false,
        setHeaders: (res, path, stat) => {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cache-Control', 'max-age=86400000') // 1d
        },
        etag: true,
        lastModified: true,
      });
    } else {
      app.useStaticAssets(path.join(baseFolder, `/${ns}/assets/`), {
        prefix: `/${ns}`,
        index: false,
        setHeaders: (res, path, stat) => {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cache-Control', 'max-age=86400000') // 1d
        },
        etag: true,
        lastModified: true,
      });
    }
    // 静态资源hash规范，也支持直接访问
    app.useStaticAssets(path.join(baseFolder, `/${ns}/assets/`), {
      prefix: `/`,
      index: false,
      setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'max-age=86400000') // 1d
      },
      etag: true,
      lastModified: true,
    });
  })
}