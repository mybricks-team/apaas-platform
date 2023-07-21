const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const packageJSON = require('./package.json');

console.log('开始发布应用...');

const args = process.argv.slice(2);

if (!args[0] || !args[0].startsWith('--origin=')) {
  console.log('发布应用失败，未配置发布源。');
  console.log('请按 node sync.js --origin=[域名] 规则配置，如：node sync.js --origin=https://my.mybricks.world');
  process.exit();
}
const domain = args[0].replace('--origin=', '');

const formData = new FormData();
formData.append('action', 'platform_publishVersion');
formData.append('userId', Buffer.from('em91eW9uZ3NoZW5nQGt1YWlzaG91LmNvbQ==', 'base64').toString('utf-8'));
formData.append('payload', JSON.stringify({
  version: packageJSON.version,
  creatorName: Buffer.from('em91eW9uZ3NoZW5nQGt1YWlzaG91LmNvbQ==', 'base64').toString('utf-8') || '',
}));
formData.append('file', fs.readFileSync(path.join(__dirname, './mybricks-apaas.zip')), `mybricks-apaas.zip`);

axios
  .post(domain + '/central/api/channel/gateway', formData, {
    headers: formData.getHeaders()
  })
  .then(res => {
    if (res.data.code === 1) {
      console.log(res.data.message || '平台发布成功!');
    } else {
      throw new Error(res.data.message || '发布应用接口错误');
    }
  })
  .catch(error => {
    console.log('发布应用失败：', error.message);
  });