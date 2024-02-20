const crypto = require('crypto');
const fs = require('fs');

/**
 * 生成RSA公私钥对
 * @return {*} publicKey: 公钥;privateKey: 私钥
 */
function genRSAKeyPaire() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
  });
  return { publicKey, privateKey };
}

/**
 * 持久化公私钥到文件
 *
 */
function writeKeyToFile() {
  const res = genRSAKeyPaire();
  fs.writeFileSync('./license-public.pem', res.publicKey, 'utf8');
  fs.writeFileSync('./license-private.pem', res.privateKey, 'utf8');
}

/**
   * 使用公钥进行加密
   * @param {String} data 
   * @param {String} publicKey 
   * @return {String} 加密后的密文
   */
function encrypt(data) {
  const privateKey = fs.readFileSync('./license-private.pem', 'utf8');
  return crypto.privateEncrypt(privateKey, Buffer.from(data)).toString('base64')
}

/**
 * 使用私钥进行解密
 * @param {String} encryptedData 
 * @param {String} privateKey 
 * @return {String} 解密后的明文
 */
function decrypt(encryptedData) {
  const publicKey = fs.readFileSync('./license-public.pem', 'utf8');
  return crypto.publicDecrypt(publicKey, Buffer.from(encryptedData, 'base64')).toString();
}

console.log(encrypt(JSON.stringify({
  clientName: 'mybricks测试环境',
  type: 'personal',
  expiredDate: '2023-12-31 23:59:59'
})))