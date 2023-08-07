import React, {
  useMemo,
  useState,
  useEffect
} from 'react'

import axios from 'axios'
import {Badge, Modal as AntdModal} from 'antd'
import {evt, observe, useComputed} from '@mybricks/rxui'
import { ExclamationCircleFilled } from '@ant-design/icons'

import AppCtx from '../AppCtx'
import AppStore from './appStore'
import {Icon, PlatformUserManage} from '../components'
import PlatformMenu from './platformMenu'
import MessageModal from './MessageModal'
import UserManageModal from './userManageModal'
import GlobalSetting from './globalSetting'
import {getApiUrl, removeCookie} from '../../utils'
import {PlatformSetting, PlatformMessage} from '../components'
import {usePanelItem} from '../hooks/usePanelItem'
import { ItemProps, ModalProps } from './type'

import css from './index.less'

const LOCALSTORAGE_MESSAGE_KEY = 'MYBRICKS_NOTICE_ALREADY_READ'

let appCtx

const { confirm } = AntdModal

export default function Sidebar({logo}) {
  appCtx = observe(AppCtx, {from: 'parents'})

  /** logo */
  const Logo = useMemo(() => {
    // TODO 点击跳转“我的”
    function logoClick() {
      history.pushState(null, '', '?appId=files')
    }

    if (logo) {
      return (
        <Icon className={css.customLogo} icon={logo} onClick={logoClick}/>
      )
    }

    return (
      <div className={css.logo} onClick={logoClick}>
        <div>
          <Icon icon={'./icon.png'}/>
        </div>
        <span>MyBricks</span>
      </div>
    )
  }, [])

  const TopMenus = useMemo(() => {
    const {DockerAPPS} = appCtx

    return (
      <div>
        {DockerAPPS.map((app) => {
          const {icon, title, namespace} = app
          return (
            <Item
              key={namespace}
              icon={icon}
              title={title}
              namespace={`?appId=${namespace}`}
            />
          )
        })}
      </div>
    )
  }, [])

  return (
    <div className={css.sidebar}>
      {Logo}
      <div className={css.menuContainer}>
        <Catelog>
          {TopMenus}
        </Catelog>
        <Catelog style={{flex: '1 0 auto', height: 0, overflow: 'hidden'}}>
          <PlatformMenu />
        </Catelog>
        <Catelog style={{marginTop: 'auto'}}>
          <SystemMenus />
        </Catelog>
      </div>
    </div>
  )
}

/** 退出登录，跳回登录页 */
function signOut() {
  confirm({
    title: '确定退出登录吗？',
    icon: <ExclamationCircleFilled />,
    centered: true,
    okText: '确认',
    cancelText: '取消',
    onOk() {
      removeCookie('mybricks-login-user')
      location.href = '/'
    },
    onCancel() {},
  })
}

/** 平台 */
function SystemMenus() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const { isAdministrator } = appCtx
  const [messages, setMessages] = useState([])
  
  useEffect(() => {
    if (isAdministrator) {
      // 检查消息通道
      axios.post(getApiUrl('/paas/api/system/channel'),  {
        type: "getLatestNoticeList", 
        isAdministrator: true
      }).then(({ data }) => {
        if (data.code === 1) {
          let alreadyReadStr = localStorage.getItem(LOCALSTORAGE_MESSAGE_KEY) || '{}';
          if(alreadyReadStr) {
            let alreadyReadObj = JSON.parse(alreadyReadStr)
            let filterList = []
            data?.data?.forEach((item) => {
              if(!alreadyReadObj[item.id] || alreadyReadObj[item.id]?.updateTime !== item.updateTime) {
                filterList.push(item)
              }
            })
            setMessages(filterList)
          } else {
            setMessages(data.data);
          }
        }
      })
    }
  }, []);

  const onDeleteMessage = ({id, updateTime, index}) => {
    let alreadyReadStr = localStorage.getItem(LOCALSTORAGE_MESSAGE_KEY) || '{}';
    let alreadyReadObj = JSON.parse(alreadyReadStr) 
    alreadyReadObj[id] = { id, updateTime }
    localStorage.setItem(LOCALSTORAGE_MESSAGE_KEY, JSON.stringify(alreadyReadObj))

    const newMessage = [...messages]
    newMessage.splice(index, 1)
    setMessages(newMessage)
  }

  return (
    <>
      {isAdministrator ? (
        <>
          <Item
            icon="https://assets.mybricks.world/icon/liuleidashuaige.png"
            title="我的应用"
            modal={{
              content: <AppStore/>
            }}
          />
          <Item
            icon={<PlatformMessage width={20} height={20}/>}
            title={messages.length ? 
               (
                <Badge count={messages.length} overflowCount={9} size='small' style={{ position: 'absolute', left: 38, top: -2, width: 30 }} >
                  消息通知
                </Badge>
              )
            : '消息通知'}
            modal={{
              title: '消息通知',
              // @ts-ignore
              content: <MessageModal messages={messages} appsMap={appCtx.APPSMap} onDelete={onDeleteMessage} />
            }}
          />
          <Item
            icon={<PlatformUserManage width={20} height={20}/>}
            title={'用户管理'}
            modal={{
              title: '用户管理',
              // @ts-ignore
              content: <UserManageModal user={appCtx.user} />
            }}
          />
          <Item
            icon={<PlatformSetting width={20} height={20}/>}
            title="设置"
            modal={{
              width: 700,
              content: <GlobalSetting/>
            }}
          />
        </>
      ) : (
        <></>
      )}
      <div className={css.user} onClick={() => {
        // TODO: 暂时关闭，后面改成配置
        // signOut()
      }}>{appCtx.user.name || appCtx.user.email}</div>
    </>
  )
}

/** 分组 */
export function Catelog({style = {}, children}): JSX.Element {
  return (
    <div className={css.catelog} style={style}>
      <div className={css.menuPanel}>
        {children}
      </div>
    </div>
  );
}

function Modal(props: ModalProps) {
  const {showPanel, Content} = usePanelItem(props);

  useEffect(() => {
    props.itemContext.onClick = showPanel;
  }, []);

  return Content;
}

/** 菜单项封装 */
export function Item({icon, title, namespace, onClick, onDragEnter, modal, prefix, suffix, focusable = true}: ItemProps): JSX.Element {
  const [itemContext] = useState({
    /** 菜单项点击 */
    onClick() {
      if (onClick) {
        onClick()
      } else {
        history.pushState(null, '', namespace)
      }
    }
  })

  /** TODO 是否被选中，未传入命名空间永远为否 */
  const className = useComputed(() => {
    let className = css.menuItem

    if (namespace) {
      const {locationSearch} = appCtx
      if (locationSearch === namespace) {
        className = className + ` ${css.menuItemActive}`;
      }
    }
    return className + (focusable ? ` ${css.focusable}` : '')
  })

  /** 菜单项信息 */
  const ItemInfo: JSX.Element = useMemo(() => {
    return (
      <>
        <div className={css.menuIcon}>
          <Icon icon={icon} width={20} height={20}/>
        </div>
        <div className={css.menuLabel}>
          <span>
            {title}
          </span>
        </div>
      </>
    )
  }, [title, icon])

  return (
    <>
      <div
        className={className}
        style={{paddingLeft: prefix ? 5 : 5 + 14}}
        onClick={() => itemContext.onClick()}
        onDragEnter={onDragEnter}
      >
        <div className={css.left}>
          {prefix && <div>{prefix}</div>}
          {ItemInfo}
        </div>

        {suffix && <div className={css.right}>{suffix}</div>}
      </div>
      {modal && <Modal {...modal} itemContext={itemContext}/>}
    </>
  )
}