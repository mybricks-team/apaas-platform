const path = require('path')

const LOGS_BASE_FOLDER = path.join(__dirname, '../logs');

const APPS_BASE_FOLDER = process.env.PLATFORM_HOSTNAME === 'FANGZHOU' ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_apps' : path.join(process.cwd(), `../_apps`);
const FILE_LOCAL_STORAGE_FOLDER = process.env.PLATFORM_HOSTNAME === 'FANGZHOU' ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_localstorage' : path.join(process.cwd(), `../_localstorage`);
const FILE_LOCAL_STORAGE_PREFIX = 'mfs'
const FILE_LOCAL_STORAGE_PREFIX_RUNTIME = 'runtime/mfs'
const NPM_REGISTRY = process.env.MYBRICKS_NPM_REGISTRY ? process.env.MYBRICKS_NPM_REGISTRY : (process.env.PLATFORM_HOSTNAME === 'FANGZHOU') ? decodeURIComponent(Buffer.from('aHR0cHMlM0EvL25wbS5jb3JwLmt1YWlzaG91LmNvbS8=', 'base64').toString('utf-8')) : 'https://registry.npm.taobao.org'

module.exports = {
  FILE_LOCAL_STORAGE_PREFIX,
  FILE_LOCAL_STORAGE_PREFIX_RUNTIME,
  FILE_LOCAL_STORAGE_FOLDER,
  APPS_BASE_FOLDER,
  LOGS_BASE_FOLDER,
  NPM_REGISTRY
}