const portfinder = require('portfinder');

/** 获取可用端口 [3100,4100] 之间 */
export const getAvailablePort = (startPort = 3100): Promise<number> => {
	return new Promise((resolve, reject) => {
		portfinder.getPortPromise({ port: startPort })
			.then(resolve)
			.catch(() => reject('获取可用端口错误'))
	})
};