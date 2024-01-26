import { MidLog } from 'mybricks-midlog';
import { init, Logger } from '@mybricks/rocker-commons';
const pm2  = require('pm2');
const fs = require('fs');
const path = require('path');
const env = require('../env.js')

export const initLogger = () => {
	MidLog.config({
		env: process.env.NODE_ENV || 'production',
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		vtrace: () => {},
		appender: [
			{
				type: 'TRACE',
				rollingFile: true,
				logdir: env.LOGS_BASE_FOLDER,
				name: 'info.log',
			},
			{
				type: 'DEBUG',
				rollingFile: true,
				logdir: env.LOGS_BASE_FOLDER,
				name: 'info.log',
			},
			{
				type: 'INFO',
				rollingFile: true,
				logdir: env.LOGS_BASE_FOLDER,
				name: 'info.log',
			},
			{
				type: 'WARN',
				rollingFile: true,
				logdir: env.LOGS_BASE_FOLDER,
				name: 'info.log',
			},
			{
				type: 'ERROR',
				rollingFile: true,
				logdir: env.LOGS_BASE_FOLDER,
				name: 'info.log',
			},
			{
				type: 'FATAL',
				rollingFile: true,
				logdir: env.LOGS_BASE_FOLDER,
				name: 'info.log',
			},
		],
	});

	init({
		// @ts-ignore
		Logger: () => {
			return new MidLog();
		},
	});
};

export const initPM2 = async () => {
	return new Promise((resolve, reject) => {
		pm2.connect(function(err) {
			if (err) {
				Logger.error(err);
				console.error(err);
				reject(err);
			}

			resolve(undefined);
		})
	});
};

export const initSlaveConfig = async (option: { port: number; masterPort: number; socketPort: number; isSlaveBackup?: boolean }) => {
	console.log(`【主服务】 写入 ecosystem.config，端口是 ${option.port}`);
	Logger.info(`【主服务】 写入 ecosystem.config，端口是 ${option.port}`);
	const indexEntryString = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
	const pm2Config = require('../ecosystem.config');
	fs.writeFileSync(path.join(__dirname, '../index_slave.js'), indexEntryString.replace('/master/main', '/src/main'));

	pm2Config.apps[0] = {
		...pm2Config.apps[0],
		name: option.isSlaveBackup ? 'index_slave_backup' : 'index_slave',
		script: './index_slave.js',
		env: {
			...pm2Config.apps[0].env,
			MYBRICKS_NODE_MODE: option.isSlaveBackup ? 'index_slave_backup' : 'index_slave',
			MYBRICKS_PLATFORM_SLAVE_PORT: option.port,
			MYBRICKS_PLATFORM_MASTER_PORT: option.masterPort,
			MYBRICKS_PLATFORM_MASTER_WS_PORT: option.socketPort
		}
	}

	fs.writeFileSync(
		path.join(__dirname, option.isSlaveBackup ? '../ecosystem.config.slave_backup.json' : '../ecosystem.config.slave.json'),
		`${JSON.stringify(pm2Config, null, 2)}`
	);

	console.log('【主服务】 ecosystem.config 写入完成');
	Logger.info('【主服务】 ecosystem.config 写入完成');
}