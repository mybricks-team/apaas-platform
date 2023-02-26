import React, {
	FC,
	useMemo,
	useState,
	useCallback
} from 'react'

import axios from 'axios'
import { Button, message, Typography } from 'antd'

import {T_App} from '../../../../AppCtx'

import styles from './index.less'

interface AppCardProps {
	app: T_App & { installInfo?: string; operateType?: string; preVersion?: string };
	setCurrentUpgrade(namespace: string): void;
	disabled: boolean;
	style: any,
}

const { Paragraph } = Typography
const LOADING_KEY = 'upgrade-loading'
const safeParse = (content = '', defaultValue = {}) => {
	try {
		return JSON.parse(content)
	} catch {
		return defaultValue
	}
}
const AppCard: FC<AppCardProps> = props => {
	const { app, setCurrentUpgrade, disabled, style } = props
	const [loading, setLoading] = useState(false)
	
	const operateText = useMemo(() => {
		if (app.operateType === 'install') {
			return '获取'
		} else if (app.operateType === 'update') {
			return '更新'
		}
		
		return ''
	}, [app])
	const changeLog = useMemo(() => {
		const installInfo = safeParse(app.installInfo)
		
		return installInfo?.changeLog
	}, [app])
	const reset = useCallback(() => {
		setLoading(false)
		setCurrentUpgrade('')
	}, [])
	
	/** 轮询判断应用安装状态 */
	const checkUpgradeStatus = useCallback((immediate = false) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { icon, description, ...otherInfo } = app
		
		setTimeout(() => {
			axios({
				method: 'get',
				url: '/api/apps/update/status',
				params: otherInfo,
				timeout: 3000,
			}).then(res => {
				if (res.data.code === 1) {
					setTimeout(() => location.reload(), 5000)
					reset()
					
					message.open({
						type: 'success',
						content: '升级成功，刷新页面可立即体验新功能，5 秒后将自动刷新页面~',
						key: LOADING_KEY,
						duration: 5,
					})
				} else if (res.data.code === -1) {
					reset()
					message.open({
						type: 'error',
						content: res.data.message || (app.operateType === 'install' ? '应用安装失败' : '应用升级失败'),
						key: LOADING_KEY,
						duration: 3,
					})
				} else {
					checkUpgradeStatus()
				}
			}).catch(() => {
				checkUpgradeStatus()
			});
		}, immediate ? 0 : 2000)
	}, [app, setCurrentUpgrade])
	
	const upgrade = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { icon, description, ...otherInfo } = app
		setLoading(true)
		setCurrentUpgrade(app.namespace)
		message.open({
			type: 'loading',
			content: '系统升级中...',
			duration: 0,
			key: LOADING_KEY,
		})
		
		axios({
			method: 'post',
			url: '/api/apps/update',
			data: otherInfo,
			timeout: 30000,
		}).then(res => {
			if (res.data.code === 1) {
				checkUpgradeStatus(true)
			} else {
				reset()
				
				message.open({
					type: 'error',
					content: res.data.message || (app.operateType === 'install' ? '应用安装失败' : '应用升级失败'),
					key: LOADING_KEY,
					duration: 3,
				})
			}
		}).catch(error => {
			reset()
			
			message.open({
				type: 'error',
				content: error.message || (app.operateType === 'install' ? '应用安装失败' : '应用升级失败'),
				key: LOADING_KEY,
				duration: 3,
			})
		})
	}, [app, setCurrentUpgrade])
	
	return (
	  <div className={styles.appCard} style={style}>
		  <div className={styles.header}>
			  <div className={styles.infoContainer}>
				  <div className={styles.icon} style={{ backgroundImage: `url(${app.icon})` }} />
				  <div className={styles.info}>
					  <div className={styles.title}>{app.title}</div>
					  <div className={styles.version}>
						  Version {app.operateType === 'update' ? `由 ${app.preVersion} 升级到 ${app.version}` : app.version}
						</div>
				  </div>
			  </div>
			  <div className={styles.operate}>
				  {operateText ? (
						  <Button
							  disabled={disabled}
							  type="text"
							  size="small"
							  loading={loading}
							  className={styles.button}
							  onClick={upgrade}
						  >
							  {operateText}
						</Button>
					 ) : null}
			  </div>
		  </div>
		  <div className={styles.description}>
			  <Paragraph
				  ellipsis={{
					  rows: 4,
					  expandable: true,
					  symbol: '更多',
				  }}
				  style={{ whiteSpace: 'pre-line' }}
			  >
				  {changeLog}
			  </Paragraph>
		  </div>
	  </div>
	)
}

export default AppCard