import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import {
  Form,
  Spin,
  Input,
  Modal,
  Upload,
  message
} from 'antd'
import axios from 'axios'
import {evt, observe} from '@mybricks/rxui'

import type {UploadProps} from 'antd/es/upload/interface'

import {Item} from '..'
import {
  uuid,
  storage,
  fileSort,
  isObject,
  getApiUrl,
  staticServer
} from '../../../utils'
import AppCtx from '../../AppCtx'
import NavMenu from './menu/navMenu'
import {useDebounceFn} from '../../hooks'
import {UserGroup, Add} from '../../components'
import {MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND} from '../../../const'

import css from './index.less'

const { Dragger } = Upload

export let appCtx: AppCtx = null

export default function PlatformMenu() {
  appCtx = observe(AppCtx, {from: 'parents'})
  return (
    <>
      <div className={css.overflowAuto}>
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
            url: getApiUrl('/paas/api/file/getMyFiles'),
            params: {
              userId: appCtx.user.email,
              extNames: 'folder,folder-project,folder-module',
              parentId
            }
          }).then(({data}) => {
            resolve(fileSort(data.data))
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
        name='我加入的协作组'
        namespace={`group`}
        child={proxyLocal}
        focusable={false}
        canDrag={(id) => !!id}
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
                resolve(fileSort(data.data))
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
      const { name, icon } = values
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/create'),
        data: {
          userId: appCtx.user.email,
          name,
          icon
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
  const [context] = useState({
    submittable: true
  })
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()
  const [imageUrl, setImageUrl] = useState<string>()
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)

  const { run: ok } = useDebounceFn(() => {
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
  }, {wait: 200});

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    setImageUrl(void 0)
    setUploadLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
    if (open && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [open])

  const uploadImage: UploadProps['customRequest'] = useCallback((options) => {
    const { file } = options

    staticServer({
      content: file,
      folderPath: `/imgs/${Date.now()}`,
      // @ts-ignore
      fileName: `${uuid()}.${file.name?.split('.').pop()}`,
    }).then((data) => {
      options.onSuccess(data.url)
    }).catch((e) => {
      options.onError(e)
    })
  }, [])

  const beforeUpload: UploadProps['beforeUpload'] = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const fileKB = file.size / 1024

      if (fileKB <= 10) {
        resolve()
      } else {
        message.info('图标必须小于10KB！')
        reject()
      }
    })
  }, [])

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
    >
      <Form
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        form={form}
      >
        <Form.Item
          label='名称'
          name='name'
          style={{height: 32, marginBottom: 24}}
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
          <Input
            onCompositionStart={() => {
              context.submittable = false
            }}
            onCompositionEnd={() => {
              context.submittable = true
            }}
            ref={ref}
            placeholder={`请输入协作组名称`}
            autoFocus
            onPressEnter={() => context.submittable && ok()}
          />
        </Form.Item>
        <Form.Item label='图标' name='icon'>
          <Spin
            spinning={uploadLoading}
            size='small'
            tip='上传中'
          >
            <div className={css.iconUploader}>
              <Dragger
                showUploadList={false}
                accept='image/*'
                disabled={uploadLoading}
                customRequest={uploadImage}
                beforeUpload={beforeUpload}
                onChange={(info) => {
                  const { file } = info
                  const { status, error, response } = file

                  if (status === 'uploading') {
                    setUploadLoading(true)
                  } else if (status === 'done') {
                    setImageUrl(response)
                    form.setFieldValue('icon', response)
                    setUploadLoading(false)
                  } else if (status === 'error') {
                    setUploadLoading(false)
                    message.error(error)
                  }
                }}
              >
                {imageUrl ? <img src={imageUrl}/> : <UserGroup width={70} height={70}/>}
              </Dragger>
            </div>
          </Spin>
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
