const path = require('path')

const FILE_LOCAL_STORAGE_BASE_FOLDER = process.env.EXTERNAL_FILE_STORAGE ? process.env.EXTERNAL_FILE_STORAGE : (process.env.PLATFORM_HOSTNAME === 'FANGZHOU' ? '/kwaishop-fangzhou-apaas-platform-service/apaas' : path.join(process.cwd(), `../`));

const LOGS_BASE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './logs');

const APPS_BASE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_apps');

const FILE_LOCAL_STORAGE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_localstorage')

const FILE_UPGRADE_LOCK_FILE = path.join(FILE_LOCAL_STORAGE_FOLDER, '_lock_.lock')

const FILE_LOCAL_STORAGE_PREFIX = 'mfs'
const FILE_LOCAL_STORAGE_PREFIX_RUNTIME = 'runtime/mfs'

const NPM_REGISTRY = process.env.MYBRICKS_NPM_REGISTRY ? process.env.MYBRICKS_NPM_REGISTRY : (process.env.PLATFORM_HOSTNAME === 'FANGZHOU') ? decodeURIComponent(Buffer.from('aHR0cHMlM0EvL25wbS5jb3JwLmt1YWlzaG91LmNvbS8=', 'base64').toString('utf-8')) : 'https://registry.npm.taobao.org'


const getAppThreadName = () => {
  try {
    const ecosystemConfig = require("./ecosystem.config.js");
    // @ts-ignore
    return ecosystemConfig?.apps?.[0]?.name ?? 'index'
  } catch(e) {
    console.log(e)
    return 'index'
  }
}

module.exports = {
  FILE_LOCAL_STORAGE_PREFIX,
  FILE_LOCAL_STORAGE_PREFIX_RUNTIME,
  FILE_LOCAL_STORAGE_FOLDER,
  APPS_BASE_FOLDER,
  LOGS_BASE_FOLDER,
  FILE_UPGRADE_LOCK_FILE,
  NPM_REGISTRY,
  getAppThreadName
}