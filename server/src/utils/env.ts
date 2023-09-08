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
  isPrivateAppStore() {
    return process.env.MYBRICKS_PRIVATE_APP_STORE; 
  },
  isPlatform_Fangzhou() {
    return process.env.PLATFORM_HOSTNAME === 'FANGZHOU';
  },
  getAppThreadName() {
    try {
      const ecosystemConfig = require("../../ecosystem.config.js");
      // @ts-ignore
      return ecosystemConfig?.apps?.[0]?.name ?? 'index'
    } catch(e) {
      console.log(e)
      return 'index'
    }
  },
  getAppInstallFolder() {
    const APPS_BASE_FOLDER = process.env.PLATFORM_HOSTNAME === 'FANGZHOU' ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_apps' : path.join(process.cwd(), "../_apps");
    return APPS_BASE_FOLDER
  }
};
