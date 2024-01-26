import { Logger } from '@mybricks/rocker-commons';
import * as path from 'path';
import { isProd } from './env';
const pm2  = require('pm2');

export const startSlaveServer = async (isSlaveBackup?: boolean) => {
	return new Promise((resolve, reject) => {
		if (isProd) {
			const config = require(path.join(process.cwd(), `./ecosystem.config.slave${isSlaveBackup ? '_backup' : ''}.json`));
			pm2.start(config.apps[0], (err, proc) => {
				const processName = isSlaveBackup ? 'index_slave_backup' : 'index_slave';
				if (err) {
					Logger.error(`子服务 ${processName} 启动失败，错误是：${err}`);
					console.error(`子服务 ${processName} 启动失败，错误是：${err}`);
					reject(err);
					return;
				}

				Logger.info(`子服务启动成功，process 名称：${processName}`);
				console.info(`子服务启动成功，process 名称：${processName}`);
				global.slaveProcess = proc;
				resolve(proc);
			});
		} else {
			resolve(undefined);
		}
	});
};

export const stopSlaveServer = async (isSlaveBackup?: boolean) => {
	return new Promise((resolve, reject) => {
		if (isProd) {
			const processName = isSlaveBackup ? 'index_slave_backup' : 'index_slave';
			pm2.stop(processName, (err, proc) => {
				if (err) {
					Logger.error(`子服务 ${processName} 停止失败，错误是：${err}`);
					console.error(`子服务 ${processName} 停止失败，错误是：${err}`);
					reject(err);
					return;
				}

				Logger.info(`子服务停止成功，process 名称：${processName}`);
				console.info(`子服务停止成功，process 名称：${processName}`);
				resolve(proc);
			});
		} else {
			resolve(undefined);
		}
	});

};