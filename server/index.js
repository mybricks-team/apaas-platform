const fs = require('fs')
if (fs.existsSync('./dist')) {
  require('ts-node/register/transpile-only')
  require('./dist/main');
} else {
  require('ts-node/register/transpile-only')
  require('./dist/main');
}