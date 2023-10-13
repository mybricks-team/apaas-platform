import {Logs} from "./index";

const nodemailer = require('nodemailer');

// 创建 nodemailer 配置
const transporter = nodemailer.createTransport({
	host: 'smtp.office365.com',
	port: 587, // SMTP 端口
	secureConnection: true,
	auth: {
		user: 'mybricks.dm@outlook.com',
		pass: 'gwmizvpczqzatjrk',
	}
});

interface MailOption {
	/** 接收人邮箱，多个以 , 分割 */
	to: string;
	/** 标题 */
	subject: string;
	/** 内容 */
	text?: string;
	/** 内容，html 格式 */
	html?: string;
}

export const sendEmail = (mailOptions: MailOption) => {
	return new Promise((resolve, reject) => {
		transporter.sendMail({ from: 'MybricksTeam <mybricks.dm@outlook.com>', ...mailOptions}, (error, info) => {
			if (error) {
				Logs.info('邮件发送错误');
				reject('邮件发送错误');
			} else {
				resolve(info.messageId);
				Logs.info('邮件发送成功 ID：' + info.messageId);
			}
		});
	});
};