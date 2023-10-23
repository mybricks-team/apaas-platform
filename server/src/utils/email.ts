import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import OpenApiUtil from '@alicloud/openapi-util';
import * as $Util from '@alicloud/tea-util';
import { Logs } from "./index";

const config = new $OpenApi.Config({
	accessKeyId: process.env.MYBRICKS_EMAIL_ACCESS_KEY_ID,
	accessKeySecret: process.env.MYBRICKS_EMAIL_ACCESS_KEY_SECRET,
});
/** Endpoint 请参考 https://api.aliyun.com/product/Dm */
config.endpoint = 'dm.aliyuncs.com';

const client = new OpenApi(config);

interface MailOption {
	/** 接收人邮箱 */
	to: string;
	/** 标题 */
	subject: string;
	/** 内容 */
	text?: string;
	/** 内容，html 格式 */
	html?: string;
}

export const sendEmail = (mailOptions: MailOption) => {
	return new Promise(async (resolve, reject) => {
		try {
			const params = new $OpenApi.Params({
				/** 接口名称 */
				action: 'SingleSendMail',
				/** 接口版本 */
				version: '2015-11-23',
				/** 接口协议 */
				protocol: 'HTTPS',
				/** 接口 HTTP 方法 */
				method: 'POST',
				authType: 'AK',
				style: 'RPC',
				/** 接口 PATH */
				pathname: '/',
				/** 接口请求体内容格式 */
				reqBodyType: 'json',
				/** 接口响应体内容格式 */
				bodyType: 'json',
			});

			const runtime = new $Util.RuntimeOptions({ });
			const request = new $OpenApi.OpenApiRequest({
				query: OpenApiUtil.query({
					AccountName: 'noreply@dm.mybricks.world',
					AddressType: 1,
					ReplyToAddress: false,
					ToAddress: mailOptions.to,
					Subject: mailOptions.subject,
					HtmlBody: mailOptions.html,
					FromAlias: 'Mybricks Team'
				}),
			});
			/** 返回值为 Map 类型，可从 Map 中获得三类数据：响应体 body、响应头 headers、HTTP 返回的状态码 statusCode */
			const { body, statusCode } = await client.callApi(params, request, runtime);

			if (statusCode === 200) {
				resolve(body.RequestId);
				Logs.info('邮件发送成功 ID：' + body.RequestId);
			} else {
				Logs.info('邮件发送错误：' + JSON.stringify(body));
				console.log('邮件发送错误', JSON.stringify(body));
				reject('邮件发送错误：' + JSON.stringify(body));
			}
		} catch (e) {
			Logs.info('邮件发送错误：' + e.message);
			reject('邮件发送错误：' + e.message);
		}
	});
};