const path = require('path')

const ENV = process.env.NODE_ENV;

const APPS_BASE_FOLDER = path.join(process.cwd(), `../_apps`);
const FILE_LOCAL_STORAGE_FOLDER = path.join(process.cwd(), `../_localstorage`);
const FILE_LOCAL_STORAGE_PREFIX = 'mfs'
const NPM_REGISTRY = 'https://registry.npm.taobao.org'

module.exports = {
  FILE_LOCAL_STORAGE_PREFIX,
  FILE_LOCAL_STORAGE_FOLDER,
  APPS_BASE_FOLDER,
  NPM_REGISTRY
}