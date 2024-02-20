const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

export function getDecryptLicense(licenseCode: string) {
  const publicKey = fs.readFileSync(path.join(__dirname, './license-public.pem'), 'utf8');
  const infoStr = crypto.publicDecrypt(publicKey, Buffer.from(licenseCode, 'base64')).toString();
  const infoObj = JSON.parse(infoStr);
  return infoObj
}