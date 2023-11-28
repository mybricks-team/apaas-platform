import { Injectable } from '@nestjs/common';
const { DOBase } = require("@mybricks/rocker-dao");
const path = require('path');
const fs = require('fs');
const env = require('../../../env.js')
import { STATUS_CODE } from '../../const';

@Injectable()
export default class SessionService {
	async checkUserSession(projectId: number, req: any) {
		// 优先判断小程序，等小程序上线改造后，再和后面的逻辑合并
		if (req.headers.referer?.includes('servicewechat.com') || req.headers?.['super'] === 'll') {
			console.log('小程序端不需要登录态')
			return { userId: '' };
		}
		const metaPath = path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}`, `PROJECT_META.json`);

		if (!fs.existsSync(metaPath)) {
			/** 文件不存在 */
			console.log('PROJECT_META.json 文件不存在');
			return { userId: '' };
		}
		const projectMeta = require(metaPath);

		if (!projectMeta.useLogin) {
			console.log('聚合页未开启登录态校验')
			return { userId: '' };
		}

		const token = req.cookies?.token;

		if (!token) {
			return {
				code: STATUS_CODE.LOGIN_OUT_OF_DATE,
				msg: '登录信息失效，请重新登录'
			}
		} else {
			const dbConnection = new DOBase();
			const _execSQL = async (sql, { args }) => {
				const conn = dbConnection;
				const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
					return ' ';
				});
				return conn.exe(handledSql, args);
			};

			const [session] = await _execSQL(`SELECT D_${projectId}_用户登录态_VIEW.id, D_${projectId}_用户登录态_VIEW.系统用户, D_${projectId}_用户登录态_VIEW.凭证, D_${projectId}_系统用户_VIEW._STATUS_DELETED FROM D_${projectId}_用户登录态_VIEW, D_${projectId}_系统用户_VIEW WHERE D_${projectId}_用户登录态_VIEW._STATUS_DELETED = 0 AND D_${projectId}_用户登录态_VIEW.凭证 = '${token}' AND D_${projectId}_用户登录态_VIEW.系统用户 = D_${projectId}_系统用户_VIEW.id ORDER BY id DESC LIMIT 1;`, { args: {} });

			if (!session) {
				return {
					code: STATUS_CODE.LOGIN_OUT_OF_DATE,
					msg: '登录信息失效，请重新登录'
				}
			} else {
				return { userId: session.系统用户, isSuperAdmin: session._STATUS_DELETED === 100 };
			}
		}
	}
}
