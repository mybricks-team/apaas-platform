const path = require('path')

const ENV = process.env.NODE_ENV;

const APPS_BASE_FOLDER = (ENV === 'staging' || ENV === 'production') ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_apps' : path.join(process.cwd(), `../_apps`);

const NPM_REGISTRY = (ENV === 'staging' || ENV === 'production') ? 'https://npm.corp.kuaishou.com/' : 'https://registry.npm.taobao.org'

module.exports = {
  APPS_BASE_FOLDER,
  NPM_REGISTRY
}