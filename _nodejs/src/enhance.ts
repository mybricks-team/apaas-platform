import * as path from "path";

export function enhanceApp(app: any, config: { appNamespaceList: string[] }) {
  config?.appNamespaceList?.forEach(ns => {
    app.useStaticAssets(path.join(__dirname, `../../_apps/${ns}/assets/`), {
      prefix: `/${ns}`,
      index: false
    });
  })
}