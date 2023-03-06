import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import axios from 'axios'
import {
  Modal,
  Input,
  Avatar,
  message,
  Tooltip,
  Form as AntdForm
} from 'antd'
import {observe, useObservable} from '@mybricks/rxui'
import {UserOutlined, EditOutlined} from '@ant-design/icons'

import {Title, ClickableIcon} from '..'
import AppCtx from '../../../../AppCtx'
import {Divider} from '../../../../components'
import {getApiUrl} from '../../../../../utils'

const {confirm} = Modal
const {TextArea} = Input

import css from './index.less'

/** 协作用户信息 */
interface GroupUser {
  /** 头像 */
  avatar?: string;
  /** 名称 */
  name?: string;
  /** ID */
  email?: string;
}

class Ctx {
  /**
   * 获取协作组信息
   * @param id 协作组ID
   */
  getInfo: (id: number) => void;
  /** 协作组信息 */
  info: null | {
    /** ID */
    id: number;
    /** 名称 */
    name: string;
    /** 创建人ID */
    creatorId: string;
    /** 创建人名称 */
    creatorName: string;
    /** 协作用户列表 */
    users: Array<GroupUser>;
    /** 协作用户总数 */
    userTotal: number;
    /** 当前用户协作信息 */
    userGroupRelation: {
      /** 权限配置 */
      roleDescription: number;
    };
  }
  /** 可管理 */
  manageable: boolean;
  /** 可编辑 */
  editable: boolean;
}

export default function Group(props) {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = useObservable(Ctx, next => next({
    getInfo(id) {
      return new Promise((resolve) => {
        axios({
          method: "get",
          url: getApiUrl(`/paas/api/userGroup/getGroupInfoByGroupId?id=${id}&userId=${appCtx.user.email}&pagtIndex=0&pageSize=5`)
        }).then(({data: {data}}) => {
          ctx.info = data
          const { userGroupRelation } = data
          const roleDescription = userGroupRelation?.roleDescription
          ctx.manageable = roleDescription === 1
          ctx.editable = roleDescription === 2
          resolve(true)
        })
      })
    }
  }), {to: 'children'})
  const {info, manageable} = ctx

  useEffect(() => {
    ctx.getInfo(props.id)
  }, [])

  return (
    <div className={css.container}>
      <Title content={info?.name} suffix={manageable && <GroupTitleConfig />}/>
      {info && (
        <>
          <DescriptionWrapper
            label='成员'
            LabelRender={manageable && (
              <UserConfig />
            )}
            DetailRender={<UserList data={info.users} total={info.userTotal}/>}
          />
          <DescriptionWrapper
            label='协作组所有者'
            value={info.creatorName || info.creatorId}
          />
        </>
      )}
      {manageable && <GroupOperate {...info}/>}
    </div>
  )
}

function GroupOperate(props) {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState(false)

  const deleteClick = useCallback(() => {
    setOpen(true)
  }, [])

  const modalOk = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/delete'),
        data: {
          userId: appCtx.user.email,
          id: props.id
        }
      }).then(({data}) => {
        if (data.code === 1) {
          history.pushState(null, '', `?appId=files`)
          appCtx.refreshSidebar('group')
          resolve('删除协作组成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('删除协作组失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderDeleteGroupModal = useMemo(() => {
    return (
      <DeleteGroupModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
        groupName={props.name}
      />
    )
  }, [open])


  return (
    <>
      <Divider />
      <button className={css.dangerButton} onClick={deleteClick}>删除协作组</button>
      {RenderDeleteGroupModal}
    </>
  )
}

function DeleteGroupModal({open, onOk, onCancel, groupName}) {
  return ConfigModal({
    open,
    onOk,
    onCancel,
    title: '确定要删除当前协作组吗？',
    Form: ({form, editRef, ok}) => {
      return (
        <AntdForm
          labelCol={{ span: 0 }}
          wrapperCol={{ span: 24 }}
          form={form}
        >
          <AntdForm.Item
            // label='名称'
            name="name"
            rules={[{ required: true, message: '输入名称与当前协作组不同', validator(rule, value) {
              return new Promise((resolve, reject) => {
                if (value !== groupName) {
                  reject(rule.message)
                } else [
                  resolve(true)
                ]
              })
            }}]}
          >
            <Input ref={editRef} placeholder={`请输入当前协作组名称以确认删除`} autoFocus onPressEnter={ok}/>
          </AntdForm.Item>
        </AntdForm>
      )
    }
  })
}

function GroupTitleConfig () {
  const ctx = observe(Ctx, {from: 'parents'})
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState(false)

  const iconClick = useCallback(() => {
    setOpen(true)
  }, [])

  const modalOk = useCallback((values) => {
    return new Promise(async (resolve, reject) => {
      const { name } = values
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/rename'),
        data: {
          userId: appCtx.user.email,
          name,
          id: ctx.info.id
        }
      }).then(async ({data}) => {
        if (data.code === 1) {
          await appCtx.refreshSidebar('group')
          ctx.info.name = name
          resolve('更改协作组名称成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('更改协作组名称失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderGroupTitleModal = useMemo(() => {
    return (
      <GroupTitleModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
        defaultValues={{name: ctx.info?.name}}
      />
    )
  }, [open])

  return (
    <>
      <ClickableIcon onClick={iconClick}>
        <EditOutlined style={{fontSize: 14}}/>
      </ClickableIcon>
      {RenderGroupTitleModal}
    </>
  )
}

function GroupTitleModal ({open, onOk, onCancel, defaultValues}) {
  return ConfigModal({
    open,
    onOk,
    onCancel,
    title: '更改协作组名称',
    defaultValues,
    Form: ({form, editRef, ok}) => {
      return (
        <AntdForm
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
          form={form}
        >
          <AntdForm.Item
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
            <Input ref={editRef} placeholder={`请输入协作组名称`} autoFocus onPressEnter={ok}/>
          </AntdForm.Item>
        </AntdForm>
      )
    }
  })
}

function UserConfig() {
  const ctx = observe(Ctx, {from: 'parents'})
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [open, setOpen] = useState(false)

  const iconClick = useCallback(() => {
    setOpen(true)
  }, [])

  const modalOk = useCallback((values) => {
    return new Promise(async (resolve, reject) => {
      const { userIds } = values
      axios({
        method: 'post',
        url: getApiUrl('/paas/api/userGroup/addUserGroupRelation'),
        data: {
          userId: appCtx.user.email,
          userIds: userIds.split(','),
          // TODO:默认是2-编辑，之后可选择配置的权限
          roleDescription: 2,
          groupId: ctx.info.id
        }
      }).then(async ({data}) => {
        if (data.code === 1) {
          await ctx.getInfo(ctx.info.id)
          resolve('添加协作用户成功')
        } else {
          reject(data.message)
        }
      }).catch((e) => {
        reject('添加协作用户失败' + e?.message || '')
      })
    })
  }, [])

  const modalCancel = useCallback(() => {
    setOpen(false)
  }, [])

  const RenderUserConfigModal = useMemo(() => {
    return (
      <UserConfigModal
        open={open}
        onOk={modalOk}
        onCancel={modalCancel}
      />
    )
  }, [open])

  return (
    <>
      <ClickableIcon onClick={iconClick}>
        <UserOutlined />
      </ClickableIcon>
      {RenderUserConfigModal}
    </>
  )
}

type InfoProps = {
  label?: any
  value?: any
  LabelRender?: JSX.Element
  DetailRender?: JSX.Element
}

function DescriptionWrapper ({label, value, LabelRender, DetailRender}: InfoProps) {
  return (
    <div className={css.descriptionWrapper}>
      <div className={css.descriptionLabel}>
        <span>{label}</span>
        {LabelRender}
      </div>
      <div className={css.descriptionDetail}>
        {value}
        {DetailRender}
      </div>
    </div>
  )
}

interface User {
  avatar?: string;
  name: string;
  email: string;
}

interface UserListProps {
  data: User[];
  total: number;
}

function UserList ({ data = [], total = 0 }: UserListProps) {
  return (
    <div className={css.userList}>
      {data.slice(0, 5).map(user => {
        return (
          <DefaultAvatar
            avatar={user.avatar}
            content={user.name || user.email}
          />
        )
      })}
      {total > 5 && (
        <DefaultAvatar content={total}/>
      )}
    </div>
  )
}

function DefaultAvatar({avatar = '', content}) {
  return (
    <div className={css.avatarWrapper}>
      <Tooltip title={content}>
        <div className={css.avatar}>
          {avatar ? (
            <Avatar
              size={32}
              style={{backgroundColor: '#ebedf0'}}
              src={avatar}
            />
          ) : (
            <Avatar
              size={32}
              style={{backgroundColor: '#ebedf0', fontSize: 14, fontWeight: 600, color: '#95999e'}}
            >
              {typeof content === 'string' ? content[0].toUpperCase() : content}
            </Avatar>
          )}
        </div>
      </Tooltip>
    </div>
  )
}

function UserConfigModal({open, onOk, onCancel}) {
  return ConfigModal({
    open,
    onOk,
    onCancel,
    title: '添加协作用户',
    bodyStyle: {
      minHeight: 126
    },
    Form: ({form, editRef, ok}) => {
      return (
        <AntdForm
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          form={form}
        >
          <AntdForm.Item
            label='用户邮箱'
            name="userIds"
            rules={[{ required: true, message: '协作用户邮箱不允许为空！', validator(rule, value) {
              return new Promise((resolve, reject) => {
                if (!value.trim()) {
                  reject(rule.message)
                } else [
                  resolve(true)
                ]
              })
            }}]}
          >
            <TextArea ref={editRef} placeholder={`请正确填写协作用户邮箱，以英文逗号隔开（xxx@163.com,www@163.com）`} onPressEnter={ok}/>
          </AntdForm.Item>
        </AntdForm>
      )
    }
  })
}

function ConfigModal({
  open,
  onOk,
  onCancel,
  Form,
  title = '标题',
  okText = '确认',
  cancelText = '取消',
  bodyStyle = {
    minHeight: 104
  },
  defaultValues = {}
}) {
  const [form] = AntdForm.useForm()
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
      form.setFieldsValue(defaultValues)
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [open])

  const RenderForm = useMemo(() => {
    return <Form form={form} editRef={ref} ok={ok}/>
  }, [])

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText={cancelText}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={bodyStyle}
    >
      {RenderForm}
    </Modal>
  )
}
