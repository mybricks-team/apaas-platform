const path = require('path')

const ENV = process.env.NODE_ENV;

const APPS_BASE_FOLDER = (ENV === 'staging' || ENV === 'production') ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_apps' : path.join(process.cwd(), `../_apps`);
const FILE_LOCAL_STORAGE_FOLDER = (ENV === 'staging' || ENV === 'production') ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_localstorage' : path.join(process.cwd(), `../_localstorage`);
const FILE_LOCAL_STORAGE_PREFIX = 'mfs'
const FILE_LOCAL_STORAGE_PREFIX_RUNTIME = 'runtime/mfs'
const NPM_REGISTRY = (ENV === 'staging' || ENV === 'production') ? 'https://npm.corp.kuaishou.com/' : 'https://registry.npm.taobao.org'

module.exports = {
  FILE_LOCAL_STORAGE_PREFIX,
  FILE_LOCAL_STORAGE_PREFIX_RUNTIME,
  FILE_LOCAL_STORAGE_FOLDER,
  APPS_BASE_FOLDER,
  NPM_REGISTRY
}