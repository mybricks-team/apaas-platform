const crypto = require('crypto');
const fs = require('fs');

// 生成公私钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// 将公私钥写入文件
fs.writeFileSync('./pems/publicKey.pem', publicKey.export({type: 'pkcs1', format: 'pem'}));
fs.writeFileSync('./pems/privateKey.pem', privateKey.export({type: 'pkcs1', format: 'pem'}));

// 要加密的数据
const plainText = JSON.stringify({
  name: 'xxx',
  expiredDate: Date.now()
});
// 使用公钥加密
const publicPem = fs.readFileSync('./pems/publicKey.pem');
const encryptedData = crypto.publicEncrypt(publicPem, Buffer.from(plainText));
console.log('加密后的数据：', encryptedData.toString('base64'));
