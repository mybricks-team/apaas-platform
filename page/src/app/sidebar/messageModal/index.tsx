import React, {
	FC,
	useState,
	useCallback
} from 'react'

import {
	Empty,
	Button,
	message,
	Collapse
} from 'antd'
import axios from 'axios'
import {CaretRightOutlined} from '@ant-design/icons'

import {getApiUrl} from '../../../utils'

import styles from './index.less'

interface MessageModalProps {
	visible: boolean;
	onClose(): void;
	messages: any[];
}
const { Panel } = Collapse
const LOADING_KEY = 'upgrade-loading'
const UpgradeButton:FC<{ app: Record<string, unknown>; setCurrentUpgrade(namespace: string): void; disabled: boolean }> = props => {
	const { app, setCurrentUpgrade, disabled } = props
	const [loading, setLoading] = useState(false)
	
	/** 轮询判断应用安装状态 */
	const checkUpgradeStatus = useCallback((immediate = false) => {
		const { icon, description, ...otherInfo } = app
		
		setTimeout(() => {
			axios({
				method: 'get',
				url: getApiUrl('/api/apps/update/status'),
				params: otherInfo,
				// timeout: 3000,
			}).then(res => {
				if (res.data.code === 1) {
					message.open({
						type: 'success',
						content: '升级成功，刷新页面可立即体验新功能，5 秒后将自动刷新页面~',
						key: LOADING_KEY,
						duration: 5,
					})
					
					setTimeout(() => location.reload(), 5000)
					setLoading(false)
					setCurrentUpgrade('')
				} else if (res.data.code === -1) {
					setLoading(false)
					setCurrentUpgrade('')
					message.open({
						type: 'error',
						content: res.data.message || '应用升级失败',
						key: LOADING_KEY,
						duration: 3,
					})
				} else {
					checkUpgradeStatus()
				}
			}).catch(() => {
				checkUpgradeStatus()
			})
		}, immediate ? 0 : 5000)
	}, [app, setCurrentUpgrade])
	
	const upgrade = useCallback((app) => {
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
			url: getApiUrl('/paas/api/apps/update'),
			data: otherInfo,
			// timeout: 30000,
		}).then(res => {
			if (res.data.code === 1) {
				checkUpgradeStatus(false)
			} else {
				setLoading(false)
				setCurrentUpgrade('')
				message.open({
					type: 'error',
					content: res.data.message || '应用升级失败',
					key: LOADING_KEY,
					duration: 3,
				})
			}
		}).catch(error => {
			console.log(error)
			setLoading(false)
			setCurrentUpgrade('')
			if(error?.code === "ERR_BAD_RESPONSE") {
				checkUpgradeStatus(false)
				return
			}
			message.open({
				type: 'error',
				content: error.message || '应用升级失败',
				key: LOADING_KEY,
				duration: 3,
			})
		})
	}, [app, setCurrentUpgrade])
	
	return <Button size="small" type="primary" disabled={disabled} loading={loading} onClick={() => upgrade(app)}>确认升级</Button>
}
const MessageModal: FC<MessageModalProps> = props => {
	const { visible, messages, onClose } = props
	const [currentUpgrade, setCurrentUpgrade] = useState('')
	const upgraded = useCallback(() => setCurrentUpgrade(''), [])
	
  return (
		<div className={`${styles.messageModal} fangzhou-theme`} style={{ minHeight: '400px' }}>
	  {/* <Modal open={visible} className={styles.messageModal} title="消息中心" mask style={{ minHeight: '400px' }} footer={null} onCancel={onClose} maskClosable width={700}> */}
		  {messages.length ? (
			  <Collapse
				  bordered={false}
				  defaultActiveKey={[messages[0].namespace]}
				  expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
				  className="site-collapse-custom-collapse"
			  >
				  {messages.map(message => {
					  return (
						  <Panel header={`【${message.name}】应用升级通知`} key={message.namespace} className="site-collapse-custom-panel">
							  <p className={styles.messageContent}>
								  <div className={styles.icon}>
									  <img src={message.icon} alt=""/>
								  </div>
								  <div className={styles.message}>
									  <div className={styles.tips}>
										  <div>{message.name}存在新版本(<b>{message.version}</b>)，请确认是否升级？</div>
										  <div>应用描述：{message.description}</div>
									  </div>
									  <div className={styles.btnGroup}>
										  <UpgradeButton disabled={currentUpgrade ? currentUpgrade !== message.namespace : false} app={message} setCurrentUpgrade={setCurrentUpgrade} />
									  </div>
								  </div>
							  </p>
						  </Panel>
					  )
				  })}
			  </Collapse>
		  ) : (
				<div className={styles.empty}>
					<Empty description="暂无消息" />
				</div>
		  )}
		{/* </Modal> */}
		</div>
  )
}

export default MessageModal
