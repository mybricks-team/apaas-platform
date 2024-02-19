const fs = require('fs');
const crypto = require('crypto');

export function getDecryptLicense(licenseCode: string) {
  const publicKey = fs.readFileSync('./license-public.pem', 'utf8');
  const infoStr = crypto.publicDecrypt(publicKey, Buffer.from(licenseCode, 'base64')).toString();
  const infoObj = JSON.parse(infoStr);
  return infoObj
}