const crypto = require('crypto');

/** 加密函数 */
export const encrypt = str => {
	/** 创建一个加密对象，使用啥方式加密 */
	const crt = crypto.createCipheriv("aes-128-cbc", 'mybricks66666666', 'mybricks66666666');

	/** 进行加密，输入使用编码，输出使用编码 */
	return crt.update(str, 'utf-8', 'hex') + crt.final('hex');
};

/** 解密函数 */
export const decrypt = str => {
	/** 创建一个加密对象，使用啥方式加密 */
	const crt = crypto.createDecipheriv("aes-128-cbc", 'mybricks66666666', 'mybricks66666666');

	/** 进行加密，输入使用编码，输出使用编码 */
	return crt.update(str, 'hex', 'utf-8') + crt.final('utf-8');
}