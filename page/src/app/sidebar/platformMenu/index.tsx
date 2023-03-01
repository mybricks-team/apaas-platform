import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  Form,
  Input,
  Modal,
  message
} from 'antd'
import axios from 'axios'
import {evt, observe} from '@mybricks/rxui'

import {Item} from '..'
import AppCtx from '../../AppCtx'
import NavMenu from './menu/navMenu'
import {UserGroup, Add} from '../../components'
import {storage, isObject, getApiUrl} from '../../../utils'
import {MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND} from '../../../const'

import css from './index.less'

export let appCtx: AppCtx = null

export default function PlatformMenu() {
  appCtx = observe(AppCtx, {from: 'parents'})
  return (
    <>
      <div style={{overflow: 'scroll'}}>
        <My />
        <Group />
      </div>
      <div style={{marginTop: 'auto'}}>
        <Item
          icon="https://assets.mybricks.world/icon/163921.png"
          title="回收站"
          namespace="?appId=trash"
        />
      </div>
    </>
  )
}

function My() {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const local: object = storage.get(MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND)
  const relLocal: object = local || {
    open: true,
    child: {}
  }
  const proxyLocal = setLocalProxy(relLocal, relLocal, MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND)

  return (
    <NavMenu
      id={'my'}
      name='我的'
      child={proxyLocal}
      namespace={`?appId=files`}
      icon='https://assets.mybricks.world/icon/myprojects.7cd8f4c7813982aa.png'
      getFiles={(id) => {
        return new Promise((resolve) => {
          const [, parentId] = id.split('-')

          axios({
            method: 'get',
            url: getApiUrl('/api/file/getMyFiles'),
            params: {
              userId: appCtx.user.email,
              extNames: 'folder,folder-project,folder-module',
              parentId
            }
          }).then(({data}) => {
            resolve(data.data)
          })
        })
      }}
      onClick={(id) => {
        const [, parentId] = id.split('-');
        history.pushState(null, '', `?appId=files${parentId ? `&parentId=${parentId}` : ''}`)
      }}
    />
  )
}

function Group() {
  // const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState(false)

  const Suffix = useMemo(() => {
    return (
      <div
        className={css.addiconContainer}
        onClick={evt(() => {
          setOpen(true)
        }).stop}
      >
        <Add width={16} height={16} />
      </div>
    )
  }, [])

  const GroupItem = useMemo(() => {
    const local: object = storage.get(MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND)
    const relLocal: object = local || {
      open: true,
      child: {}
    }
    const proxyLocal = setLocalProxy(relLocal, relLocal, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND)

    return (
      <NavMenu
        id={''}
        name='协作组'
        namespace={`group`}
        child={proxyLocal}
        focusable={false}
        icon={UserGroup}
        suffix={Suffix}
        getFiles={(id) => {
          return new Promise((resolve) => {
            const [groupId, parentId] = id.split('-')

            if (groupId) {
              // 查文件夹
              axios({
                method: 'get',
                url: getApiUrl('/api/file/getGroupFiles'),
                params: {
                  userId: appCtx.user.email,
                  extNames: 'folder,folder-project,folder-module',
                  parentId,
                  groupId
                }
              }).then(({ data }) => {
                resolve(data.data)
              })
            } else {
              // 查协作组
              axios({
                method: 'get',
                url: getApiUrl('/paas/api/userGroup/getVisibleGroups'),
                params: {
                  userId: appCtx.user.email
                }
              }).then(({ data: { data } }) => {
                resolve(data)
              })
            }
          })
        }}
        onClick={(id) => {
          const [groupId, parentId] = id.split('-')
          history.pushState(null, '', `?appId=files${groupId ? `&groupId=${groupId}` : ''}${parentId ? `&parentId=${parentId}` : ''}`)
        }}
      />
    )
  }, [])

  const modalOk = useCallback((values, app) => {
    return new Promise(async (resolve, reject) => {
      const { name } = values
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/create'),
        data: {
          userId: appCtx.user.email,
          name
        }
      }).then(async ({data}) => {
        if (data.code === 1) {
          await appCtx.refreshSidebar('group')
          resolve('创建协作组成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('创建协作组失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderCreateAppModal = useMemo(() => {
    return (
      <CreateGroupModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
      />
    )
  }, [open])

  return (
    <>
      {GroupItem}
      {RenderCreateAppModal}
    </>
  )
}

function CreateGroupModal({open, onOk, onCancel}) {
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

  const ok = useCallback(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warn(e)
      })
    }).catch(() => {})
  }, [])

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [open])

  return (
    <Modal
      open={open}
      title={'新建协作组'}
      okText={'确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={{
        minHeight: 104
      }}
    >
      <Form
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        form={form}
      >
        <Form.Item
          label='名称'
          name="name"
          rules={[{ required: true, message: '请输入协作组名称！', validator(rule, value) {
            return new Promise((resolve, reject) => {
              if (!value.trim()) {
                reject(rule.message)
              } else [
                resolve(true)
              ]
            })
          }}]}
        >
          <Input ref={ref} placeholder={`请输入协作组名称`} autoFocus onPressEnter={ok}/>
        </Form.Item>
      </Form>
    </Modal>
  )
}

/**
 * nav开关信息写入localStorage
 * @param obj 
 * @param parentObj 
 * @param localKey 
 * @returns 
 */
export function setLocalProxy (obj, parentObj, localKey) {
  return new Proxy(obj, {
    set(target, key, value) {
      const preValue = target[key]

      target[key] = value

      if (key === 'open' || key === 'child') {
        if (preValue !== value) {
          if (value === false) {
            Reflect.set(target, 'child', {})
          }
          storage.set(localKey, parentObj)
        }
      }

      return true
    },
    get(target, key) {
      let value = target[key]

      if (isObject(value)) {
        value = setLocalProxy(value, parentObj, localKey)
      }

      return value
    }
  })
}
