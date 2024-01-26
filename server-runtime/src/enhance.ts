import * as path from "path";
import env from "./utils/env";

export function enhanceApp(app: any, config: { appNamespaceList: string[] }) {
  config?.appNamespaceList?.forEach(ns => {
    const baseFolder = env.getAppInstallFolder()
    // ns切割
    app.useStaticAssets(path.join(baseFolder, `/${ns}/assets/`), {
      prefix: `/${ns}`,
      index: false,
      setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'no-cache') // 1d
      },
      etag: true
    });
    // 静态资源hash规范，也支持直接访问
    app.useStaticAssets(path.join(baseFolder, `/${ns}/assets/`), {
      prefix: `/`,
      index: false,
      setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'no-cache') // 1d
      },
      etag: true
    });
  })
}