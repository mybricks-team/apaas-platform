import React, {
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'
import {
  Form,
  Input,
  Button,
  message,
  Switch,
  Select,
  Popover,
  Upload
} from 'antd'
import styles from '../index.less'

const GlobalForm = ({ initialValues, onSubmit, style }) => {
  const [form] = Form.useForm()
  const [openSystemWhiteListSwitch, setOpenSystemWhiteListSwitch] = useState(initialValues?.openSystemWhiteList)
  const [openLogoutSwitch, setOpenLogoutSwitch] = useState(initialValues?.openLogout)
  const [openUserInfoSettingSwitch, setOpenUserInfoSettingSwitch] = useState(initialValues?.openUserInfoSetting)
  const [openConflictDetectionSwitch, setOpenConflictDetectionSwitch] = useState(initialValues?.openConflictDetection)

  useEffect(() => {
    if (!initialValues) {
      return
    }
    form?.setFieldsValue?.(initialValues)
  }, [initialValues])

  return (
    <div className={styles.globalForm} style={style}>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        labelAlign="left"
        autoComplete="off"
      >
        <Form.Item
          initialValue=""
          label="站点Logo"
          name="logo"
        >
          <Input placeholder='请填写自定义 logo 的 url 地址（高度36px，宽度自适应）' />
        </Form.Item>
        <Form.Item
          initialValue=""
          label="页面标题"
          name="title"
        >
          <Input placeholder='页面html的title' />
        </Form.Item>
        <Form.Item
          initialValue=""
          label="页面ICON"
          name="favicon"
        >
          <Input placeholder='页面html的favicon' />
        </Form.Item>
        <Form.Item
          initialValue=''
          label="开启系统白名单"
          name="openSystemWhiteList"
        >
          <Switch checked={openSystemWhiteListSwitch} onChange={() => {
            setOpenSystemWhiteListSwitch(!openSystemWhiteListSwitch)
          }} />
        </Form.Item>
        <Form.Item
          initialValue=''
          label="开启退出登录"
          name="openLogout"
        >
          <Switch checked={openLogoutSwitch} onChange={() => {
            setOpenLogoutSwitch(!openLogoutSwitch)
          }} />
        </Form.Item><Form.Item
          initialValue=''
          label="开启个人资料设置"
          name="openUserInfoSetting"
        >
          <Switch checked={openUserInfoSettingSwitch} onChange={() => {
            setOpenUserInfoSettingSwitch(!openUserInfoSettingSwitch)
          }} />
        </Form.Item>
        <Form.Item
          initialValue=''
          label="开启升级冲突检测"
          name="openConflictDetection"
        >
          <Switch checked={openConflictDetectionSwitch} onChange={() => {
            setOpenConflictDetectionSwitch(!openConflictDetectionSwitch)
          }} />
        </Form.Item>
        <Form.Item
          initialValue=""
          label="应用黑名单"
          name="appBlackList"
        >
          <Input.TextArea rows={2} placeholder='默认关闭应用黑名单' />
        </Form.Item>
        <Form.Item
          initialValue=""
          label="权限配置"
          name="authConfig"
        >
          <Input.TextArea rows={4} placeholder='不同角色新建文件数量' />
        </Form.Item>
        <Form.Item
          initialValue=""
          label="基于模板新建"
          name="createBasedOnTemplate"
        >
          <Input.TextArea rows={2} placeholder='开启的应用白名单' />
        </Form.Item>
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          style={{ position: 'absolute', right: 0 }}
          type="primary"
          onClick={() => {
            form?.validateFields().then((values) => {
              typeof onSubmit === 'function' && onSubmit(values)
            })
          }}
        >
          保存
        </Button>
      </div>
    </div>
  )
}

export default GlobalForm