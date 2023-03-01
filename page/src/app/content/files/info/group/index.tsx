import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import axios from 'axios'
import {
  Form,
  Modal,
  Input,
  Avatar,
  message,
  Tooltip
} from 'antd'
import {UserOutlined} from '@ant-design/icons'
import {observe, useObservable} from '@mybricks/rxui'

import {Title} from '..'
import AppCtx from '../../../../AppCtx'
import {getApiUrl} from '../../../../../utils'

const {TextArea} = Input

import css from './index.less'

class Ctx {
  getInfo: (id: number) => void;
  info: null | {
    id: number;
    name: string;
    creatorId: string;
    creatorName: string;
    users: Array<any>;
  }
}

export default function Group(props) {
  const ctx = useObservable(Ctx, next => next({
    getInfo(id) {
      return new Promise((resolve) => {
        axios({
          method: "get",
          url: getApiUrl(`/paas/api/userGroup/getGroupInfoByGroupId?id=${id}`)
        }).then(({data: {data}}) => {
          ctx.info = data
          resolve(true)
        })
      })
    }
  }), {to: 'children'})
  const appCtx = observe(AppCtx, {from: 'parents'})
  const {info} = ctx

  useEffect(() => {
    ctx.getInfo(props.id)
  }, [])

  return (
    <div className={css.container}>
      <Title content={info?.name}/>
      {info && (
        <>
          <DescriptionWrapper
            label='成员'
            LabelRender={appCtx.user.email === info.creatorId && (
              <UserConfig />
            )}
            DetailRender={<UserList data={info.users}/>}
          />
          <DescriptionWrapper
            label='协作组所有者'
            value={info.creatorName || info.creatorId}
          />
        </>
      )}
    </div>
  )
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
      <div className={css.userConfigIcon} onClick={iconClick}>
        <UserOutlined />
      </div>
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
  data: User[]
}

function UserList ({ data = [] }: UserListProps) {
  // const total = data.length
  return (
    <div className={css.userList}>
      {/* {data.slice(0, 5).map(user => {
        return (
          <DefaultAvatar
            avatar={user.avatar}
            content={user.name || user.email}
          />
        )
      })}
      {total > 5 && (
        <DefaultAvatar content={total}/>
      )} */}
      {data.map(user => {
        return (
          <DefaultAvatar
            avatar={user.avatar}
            content={user.name || user.email}
          />
        )
      })}
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
              {content[0].toUpperCase()}
            </Avatar>
          )}
        </div>
      </Tooltip>
    </div>
  )
}

function UserConfigModal({open, onOk, onCancel}) {
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
      title={'添加协作用户'}
      okText={'确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={{
        minHeight: 126
      }}
    >
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        form={form}
      >
        <Form.Item
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
          <TextArea ref={ref} placeholder={`请正确填写协作用户邮箱，以英文逗号隔开（xxx@163.com,www@163.com）`} autoFocus onPressEnter={ok}/>
        </Form.Item>
      </Form>
    </Modal>
  )
}
