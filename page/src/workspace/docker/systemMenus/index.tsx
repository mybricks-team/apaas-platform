import React, {
  useState,
  useEffect,
  useCallback
} from 'react';
import axios from 'axios';
import {Badge, Modal} from 'antd';
import {observe, useComputed} from '@mybricks/rxui';

import AppStore from './../../app-store';
import {Item, Catelog} from '../Docker';
import MessageModal from '../message-modal';
import GlobalSetting from '../global-setting';
import {IconMessage, IconSetting} from '../../icon';
import WorkspaceContext from '../../WorkspaceContext';
import {COOKIE_LOGIN_USER} from '../../../constants';
import {getApiUrl, removeCookie} from '../../../utils';

// @ts-ignore
import css from './index.less';

let wsCtx: WorkspaceContext

/** 全局信息 */
export function SystemMenus(): JSX.Element {
  wsCtx = observe(WorkspaceContext, {from: 'parents'})
  const {user} = wsCtx

  /** 登出 */
  const onLogout = useCallback(() => {
		if(document.cookie.indexOf(COOKIE_LOGIN_USER) !== -1) {
			Modal.confirm({
				title: '确认退出登录吗',
				okText: '退出',
				cancelText: '取消',
				onOk: () => {
					removeCookie(COOKIE_LOGIN_USER);
					setTimeout(() => {
						location.href = '/'
					}, 0);
				}
			});
		}
	}, []);

  return (
    <Catelog style={{marginTop: 'auto'}}>
      <Config/>
      <div className={css.user} onClick={onLogout}>{user.email}</div>
    </Catelog>
  );
}

/** 全局配置 */
function Config(): JSX.Element {
  const isAdministrator = useComputed(() => wsCtx.isAdministrator)
  /** MessageModal 状态 */
  const [messages, setMessages] = useState<any[]>([]);

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
          icon="https://assets.mybricks.world/icon/liuleidashuaige.png"
          title="我的应用"
          modal={{
            content: <AppStore/>
          }}
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
          modal={{
            title: '消息通知',
            // @ts-ignore
            content: <MessageModal messages={messages}/>
          }}
        />
      }
      {isAdministrator &&
        <Item
          icon={<IconSetting width={20} height={20}/>}
          title="设置"
          modal={{
            width: 700,
            content: <GlobalSetting/>
          }}
        />
      }
    </>
  );
}
