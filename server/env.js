const path = require('path')

const FILE_LOCAL_STORAGE_BASE_FOLDER = process.env.EXTERNAL_FILE_STORAGE ? process.env.EXTERNAL_FILE_STORAGE : path.join(process.cwd(), `../`);

const LOGS_BASE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './logs');

const APPS_BASE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_apps');

const FILE_LOCAL_STORAGE_FOLDER = path.join(FILE_LOCAL_STORAGE_BASE_FOLDER, './_localstorage')

const FILE_APP_PRODUCTS_FOLDER_PREFIX = '__app_products__'
const FILE_APP_PRODUCTS_FOLDER = path.join(FILE_LOCAL_STORAGE_FOLDER, `./${FILE_APP_PRODUCTS_FOLDER_PREFIX}`)

const FILE_LOCAL_STORAGE_PREFIX = 'mfs'
const FILE_LOCAL_STORAGE_PREFIX_RUNTIME = 'runtime/mfs'

const NPM_REGISTRY = process.env.MYBRICKS_NPM_REGISTRY ? process.env.MYBRICKS_NPM_REGISTRY : 'https://registry.npmmirror.com'


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
  FILE_APP_PRODUCTS_FOLDER_PREFIX,
  FILE_APP_PRODUCTS_FOLDER,
  APPS_BASE_FOLDER,
  LOGS_BASE_FOLDER,
  NPM_REGISTRY,
  getAppThreadName
}