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
  type: 'personal',
  expiredDate: '2024-12-31 23:59:59'
})))

// console.log(decrypt('Jgwgzs7SQiqrqpxOydL2ma+4CRwwRX4HGIi3rRsC0EVb4BC2hsM7qwa4Yj3iSlf+CCZLVnKkFzun0xb+JAdjWM0ElP2ZR0Ac+/CgaMho6PPhH1mqs/8/53hIhtrBE5gGgTcUi4Rh/sIkmbgmvyHN1x32CPv4c68zQGPYih03UWX0nRRXFfuidWs7z36t+ny/Cau5JerNBaVZhsogjQScL7PHWD28oNvPMPEkS2SLIrbKTpbKKOCE/o8WzV8RXVvV9JlWmsYLISx48kVR8hC1HBXrw1JKBG6XCdjHB6Oj0ruDnosCDZbgtISvAQP8A8Uvx+4/ctfBoifKRt9UpaXIwAHqTyolAsfr0z5Yu5erI29U+oHXCLTXsqwdHsf8HENXNfflxSxUnArQ3eGTRkb0MifCo0B8ZA4oPbZms8AiOwpQtWdTOZUqge+NtRvrA4qOdkHFqfqLZJR2prmYLqTzjE96Zbd6Cf4LrCdLQ0cwCo493SoUIWxMhJRX6KuYn9yL9FnliiJ+3KtVdB4kP4FHEcBsuB9QbSI/mEMKL62cOymc4hi3Y6uGQZ4ynkrjp5GQX1tWSa3XdqWNGfCV+NXTX72aPkKVdwifv31lgBKa4sbHM35FhwApw3xhEm5a7Wu61svQNs+37ntJJFU4aHOAm0E3KEmp2XjT+bFZ4uOD2eA='))
