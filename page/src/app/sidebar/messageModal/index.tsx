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

const MessageModal: FC<MessageModalProps> = props => {
	const { visible, messages, onClose } = props
	const [currentUpgrade, setCurrentUpgrade] = useState('')
	
  return (
		<div className={`${styles.messageModal} fangzhou-theme`} style={{ minHeight: '400px' }}>
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
