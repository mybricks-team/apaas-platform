const crypto = require('crypto');
const fs = require('fs');

// 加载公私钥
const privatePem = fs.readFileSync('./pems/privateKey.pem');

// 使用私钥解密
const decryptedData = crypto.privateDecrypt(privatePem, Buffer.from('Hi4bAE8LzQ0m1KkIy4iCOGFiFQ3x5F/UBng/2MH/5Kn9Qfh2PheVNixpzhKr/kd1wIUXJZfpd+OjWwQTRCvM0WAnwMdJFreKMSyQGLC+L2/bSF5dGYDwBbezHh3isGRnkurZbSdrLW77vEjM1U3ooz57FKThBRliEGU72FrIFm2HAPy1ZjRPIFqMLnn6QWLyDEPCeZB1lXYzgKibgFwE0TZmERaTMHh5D4KNhhuCbPzlp+x6nA9+2ily/I9wHWjt7JjC5YHsaoxRC1ppS1KaPYsv6jcJgGKs7d5g5oNcX0F1hsw67GAFdO3N2Rywbq2aEwLwhov3yMQOiROTe4hMoA==', 'base64'));
console.log('解密后的数据：', decryptedData.toString());