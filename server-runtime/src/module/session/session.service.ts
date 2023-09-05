import { Injectable } from '@nestjs/common';
const { DOBase } = require("@mybricks/rocker-dao");
const path = require('path');
const env = require('../../../env.js')

@Injectable()
export default class SessionService {
	async checkUserSession(projectId: number, req: any) {
		// 优先判断小程序，等小程序上线改造后，再和后面的逻辑合并
		if (req.headers.referer?.includes('servicewechat.com') || req.headers?.['super'] === 'll') {
			console.log('小程序端不需要登录态')
			return { userId: '' };
		}
		const projectMeta = require(path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`, `PROJECT_META.json`));

		if (!projectMeta.useLogin) {
			console.log('聚合页未开启登录态校验')
			return { userId: '' };
		}

		const token = req.cookies?.token;

		if (!token) {
			throw new Error('登录信息失效，请重新登录');
		} else {
			const dbConnection = new DOBase();
			const _execSQL = async (sql, { args }) => {
				const conn = dbConnection;
				const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
					return ' ';
				});
				return conn.exe(handledSql, args);
			};

			const [session] = await _execSQL(`SELECT id, 系统用户, 凭证 FROM D_${projectId}_用户登录态_VIEW WHERE _STATUS_DELETED = 0 AND 凭证 = '${token}' ORDER BY id DESC LIMIT 1;`, { args: {} });

			if (!session) {
				throw new Error('登录信息失效，请重新登录');
			} else {
				return { userId: session.系统用户 };
			}
		}
	}
}
