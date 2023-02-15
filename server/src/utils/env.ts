import * as path from "path";

export default {
  isDev() {
    return process.env.NODE_ENV === "development";
  },
  isStaging() {
    return process.env.NODE_ENV === "staging";
  },
  isProd() {
    return process.env.NODE_ENV === "production";
  },
  getAppInstallFolder() {
    const ENV = process.env.NODE_ENV;
    const APPS_BASE_FOLDER = (ENV === 'staging' || ENV === 'production') ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_apps' : path.join(process.cwd(), "../_apps");
    return APPS_BASE_FOLDER
  }
};
