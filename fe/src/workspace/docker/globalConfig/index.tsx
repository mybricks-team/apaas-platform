import React, {
	useMemo,
	useState,
	useEffect,
	useCallback
} from 'react';
import axios from 'axios';
import {Badge, Modal, message} from 'antd';

import {Item, Catelog} from '../Docker';
import MessageModal from '../message-modal';
import ConfigModal from '../config-modal';
import {IconMessage, IconSetting} from '../../icon';
import {COOKIE_LOGIN_USER} from '../../../constants';
import {getApiUrl, removeCookie} from '../../../utils';
import WorkspaceContext, {BOTTOM_APP_MENU_ITEMS} from '../../WorkspaceContext';

// @ts-ignore
import css from './index.less';

/** 全局信息 */
export function GlobalConfig({user}): JSX.Element {
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
			<Config user={user}/>
			<div className={css.user} onClick={onLogout}>{user.email}</div>
		</Catelog>
	);
}

/** 全局配置 */
function Config({user}): JSX.Element {
	/** MessageModal 状态 */
	const [messages, setMessages] = useState<any[]>([]);
	const [showMessageModal, setShowMessageModal] = useState(false);
	
	const submit = useCallback((value) => {
			axios({
				method: 'post',
				url: getApiUrl('/api/config/update'),
				data: {
					namespace: 'system',
					userId: user.email,
					config: value
				}
			}).then((res) => {
				const {code} = res.data;
				if (code === 1) {
					close();
				}
			}).catch(err => {
				message.error(err.message);
			});
		}, []);
	/** MessageModal 事件 */
	const onShowMessageModal = useCallback(() => setShowMessageModal(true), []);
	const onCloseMessageModal = useCallback(() => setShowMessageModal(false), []);
	
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
	
	/** 消息通知按钮 */
	const GlobalMessage: JSX.Element = useMemo(() => {
		return (
			<Item
				Icon={<IconMessage width={20} height={20}/>}
				Title={messages.length ? (
					// @ts-ignore
					<Badge count={messages.length} size="small" offset={[10, 0]}>
						消息通知
					</Badge>
				) : <>消息通知</>}
				onClick={onShowMessageModal}
			/>
		);
	}, [messages])
	
	
	/** 消息通知弹窗 */
	const RenderMessageModal: JSX.Element = useMemo(() => {
		// @ts-ignore
		return <MessageModal visible={showMessageModal} messages={messages} onClose={onCloseMessageModal}/>;
	}, [showMessageModal]);
	
	/** 配置页面 */
	const RenderConfigModal: JSX.Element = useMemo(() => {
		// @ts-ignore
		return <ConfigModal />;
	}, [user]);
	
	/** 全局配置按钮 */
	const GlobalSetting: JSX.Element = useMemo(() => {
		return (
			<Item
				Title={<>设置</>}
				Icon={<IconSetting width={20} height={20}/>}
				onClick={() => {
					// @ts-ignore
					WorkspaceContext.selectedApp = { Element: ConfigModal, title: '设置', isInlineApp: true };
				}}
			/>
		);
	}, [RenderConfigModal]);
	
	return (
		<>
			{BOTTOM_APP_MENU_ITEMS.map((app) => {
				const {namespace} = app;

				if (WorkspaceContext.adminNameSpaces.includes(namespace) && !WorkspaceContext.isAdministrator) {
					return null
				}
				
				return (
					<Item
						key={namespace}
						active={false}
						item={app}
						onClick={() => WorkspaceContext.selectedApp = app}
					/>
				);
			})}
			{WorkspaceContext.isAdministrator && GlobalMessage}
			{WorkspaceContext.isAdministrator && GlobalSetting}
			{RenderMessageModal}
		</>
	);
}