const path = require('path')

const ENV = process.env.NODE_ENV;

const FILE_LOCAL_STORAGE_FOLDER = (ENV === 'staging' || ENV === 'production') ? '/kwaishop-fangzhou-apaas-platform-service/apaas/_localstorage' : path.join(process.cwd(), `../_localstorage`);
const FILE_LOCAL_STORAGE_PREFIX = 'mfs'

module.exports = {
  FILE_LOCAL_STORAGE_PREFIX,
  FILE_LOCAL_STORAGE_FOLDER
}