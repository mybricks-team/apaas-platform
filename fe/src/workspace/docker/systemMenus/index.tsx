import React, {
	useState,
	useEffect,
	useCallback
} from 'react';
import { useComputed } from 'rxui-t'
import axios from 'axios';
import {Badge, Modal} from 'antd';

import {Item, Catelog} from '../Docker';
import MessageModal from '../message-modal';
import GlobalSetting from '../global-setting';
import AppStore from './../../app-store'
import {IconMessage, IconSetting} from '../../icon';
import {COOKIE_LOGIN_USER} from '../../../constants';
import {getApiUrl, removeCookie} from '../../../utils';
import WorkspaceContext from '../../WorkspaceContext';

// @ts-ignore
import css from './index.less';

export const usePanelItem = ({
	title = '',
	width = 800,
	content,
	type = 'modal'
}) => {
	const [show, setShow] = useState(false);
	const showModal = useCallback(() => {
		setShow(true)
	}, [])

	return {
		showPanel: type === 'modal' ? showModal : () => {},
		Content: ( type === 'modal' ?
			<Modal title={title} footer={false} width={width} style={{ maxWidth: '90vw' }} destroyOnClose onCancel={() => setShow(false)} open={show}>
				{content}
			</Modal> : null 
		)
	}
}


/** 全局信息 */
export function SystemMenus(): JSX.Element {
	const user = useComputed(() => WorkspaceContext.user)
	/** 登出 */
	const onLogout = useCallback(() => {
		Modal.confirm({
			title: '确认退出登录吗',
			okText: '退出',
			cancelText: '取消',
			onOk: () => {
				removeCookie(COOKIE_LOGIN_USER);
				setTimeout(() => {
					location.reload();
				}, 0);
			}
		});
	}, []);
	
	return (
		<Catelog style={{marginTop: 'auto'}}>
			<Config />
			<div className={css.user} onClick={onLogout}>{user.email}</div>
		</Catelog>
	);
}

/** 全局配置 */
function Config(): JSX.Element {
	const isAdministrator = useComputed(() => WorkspaceContext.isAdministrator)
	/** MessageModal 状态 */
	const [messages, setMessages] = useState<any[]>([]);

	const { showPanel: showMessagePanel, Content: RenderMessagePanel } = usePanelItem({
		title: '消息通知',
		content: <MessageModal messages={messages} />
	})

	const { showPanel: showAppPanel, Content: RenderAppPanel } = usePanelItem({
		// title: '我的应用',
		content: <AppStore />
	})
	
	const { showPanel: showConfigPanel, Content: RenderConfigPanel } = usePanelItem({
		width: 700,
		content: <GlobalSetting />
	})
	
	useEffect(() => {
		/** 检查应用更新 */
		axios({
			method: "get",
			url: getApiUrl('/api/apps/update/check')
		}).then(res => {
			if (res.data.code === 1) {
				setMessages(res.data.data);
			}
		})
	}, []);
	
	return (
		<>
			{isAdministrator && 
				<Item
					icon={<IconSetting width={20} height={20}/>}
					title="我的应用"
					onClick={showAppPanel}
				/>
			}
			{isAdministrator && 
				<Item
					icon={<IconMessage width={20} height={20}/>}
					title={messages.length ? (
						// @ts-ignore
						<Badge count={messages.length} size="small" offset={[10, 0]}>
							消息通知
						</Badge>
					) : <>消息通知</>}
					onClick={showMessagePanel}
				/>
			}
			{isAdministrator && 
				<Item
					icon={<IconSetting width={20} height={20}/>}
					title="设置"
					onClick={showConfigPanel}
				/>
			}
			{RenderMessagePanel}
			{RenderConfigPanel}
			{RenderAppPanel}
		</>
	);
}
