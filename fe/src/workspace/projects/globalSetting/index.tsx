import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form, Select, Button, message } from 'antd'
import axios from 'axios'
import { useComputed } from 'rxui-t'
import { SettingOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'

import { getApiUrl } from '../../../utils'
import WorkspaceContext from '../../WorkspaceContext'

// @ts-ignore
import styles from './index.less'

interface TabsProps {
  onClick: (e: any) => void
  activeKey?: string
  items: Array<{
    label: string
    key: string
    icon: JSX.Element
  }>
  style?: any
}

const Tabs = ({ onClick, activeKey, items = [], style }: TabsProps) => {
  if (!Array.isArray(items)) {
    return null
  }

  return (
    <div className={styles.tabs} style={style}>
      {items.map((item) => (
        <div
          key={item.key}
          className={`${styles.tab} ${
            activeKey === item.key ? styles.activeTab : ''
          }`}
          onClick={() => onClick?.({ key: item.key })}
        >
          <div className={styles.icon}>{item?.icon}</div>
          <div className={styles.label}>{item?.label}</div>
        </div>
      ))}
    </div>
  )
}

export default () => {
  const user = useComputed(() => WorkspaceContext.user)
  const [activeKey, setActiveKey] = useState()
  const [keyJumpMap, setKeyJumpMap] = useState({})
  const [form] = Form.useForm()
  const [menuItems, setMenuItems] = useState([
    { label: '全局设置', key: 'system', icon: <SettingOutlined /> },
  ])
  const [formData, setFormData] = useState({ cdnPath: '' })

  useEffect(() => {
    axios({
      method: 'post',
      url: getApiUrl('/api/config/get'),
      data: {
        scope: ['system'],
      },
    })
      .then((res) => {
        const { code, data } = res.data
        if (code === 1) {
          const { config } = data?.system ?? {}
          try {
            if (typeof config === 'string') {
              setFormData(JSON.parse(config))
            } else {
              setFormData(config)
            }
          } catch {
            setFormData({ cdnPath: '' })
          }
          // setVisible(true);
        }
      })
      .catch((err) => {
        message.error(err.message)
      })
  }, [])

  useEffect(() => {
    form?.setFieldsValue?.(formData)
  }, [formData])

  const handleSubmit = useCallback(() => {
    form?.validateFields().then((values) => {
      axios({
        method: 'post',
        url: getApiUrl('/api/config/update'),
        data: {
          namespace: 'system',
          userId: user.email,
          config: values,
        },
      })
        .then((res) => {
          const { code } = res.data
          if (code === 1) {
            message.success('保存成功')
            // close();
          }
        })
        .catch((err) => {
          message.error(err.message)
        })
    })
  }, [user])

  const GlobalForm = () => {
    return (
      <div className={styles.globalForm}>
        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          labelAlign="left"
          autoComplete="off"
        >
          <Form.Item
            initialValue="about.html"
            label="首页"
            name="platformHome"
            required
            rules={[{ required: true, type: 'string', message: '请设置首页' }]}
          >
            <Select
              options={[
                {
                  value: 'about.html',
                  label: 'Mybricks介绍页',
                },
                {
                  value: 'login.html',
                  label: '登录页',
                },
              ]}
            ></Select>
          </Form.Item>
        </Form>
        <div className={styles.btnGroups}>
          <Button
            size="middle"
            style={{ position: 'absolute', right: 0 }}
            type="primary"
            onClick={handleSubmit}
          >
            保存
          </Button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const newMenuItems = [...menuItems]
    const keyJumpMap = {}
    WorkspaceContext.InstalledAPPS?.forEach((app) => {
      if (app.setting) {
        newMenuItems.push({
          label: app.title,
          key: app.namespace,
          icon: app.icon ? <img src={app.icon} /> : <SettingOutlined />,
        })
        let urlPath = ''
        app?.exports?.forEach((element) => {
          if (element.name === app.setting?.call) {
            urlPath = `${app.namespace}/${element.path}`
          }
        })
        keyJumpMap[app.namespace] = urlPath
      }
    })
    setKeyJumpMap(keyJumpMap)
    setMenuItems(newMenuItems)
  }, [])

  const renderContent = () => {
    if (!activeKey) {
      return null
    }

    return (
      <div className={styles.setting}>
        {activeKey === 'system' ? (
          <GlobalForm />
        ) : (
          keyJumpMap?.[activeKey] && (
            <iframe
              src={keyJumpMap[activeKey]}
              // @ts-ignore
              frameborder="no"
              border="0"
              style={{
                minHeight: '500px',
                maxHeight: '90vh',
                height: 600,
                width: '100%',
              }}
            />
          )
        )}
      </div>
    )
  }

  const activeTitle = useMemo(() => {
    return menuItems?.find?.((t) => t.key === activeKey)?.label ?? '设置'
  }, [activeKey, menuItems])

  return (
    // <Content title="设置">
    <div className={`${styles.configModal} fangzhou-theme`}>
      <div className={styles.title}>
        {activeKey && (
          <LeftOutlined
            style={{ marginRight: 10, cursor: 'pointer' }}
            onClick={() => setActiveKey('')}
          />
        )}
        {activeTitle}
      </div>
      {/* <div className={styles.userInfo}>
        <div className={styles.left}>

          <div>{user?.email}</div>
        </div>
      </div> */}
      <div className={styles.configContainer}>
        <Tabs
          style={{ display: !activeKey ? 'flex' : 'none' }}
          onClick={(e) => {
            setActiveKey(e.key)
          }}
          // activeKey={activeKey}
          items={menuItems}
        />
        {renderContent()}
      </div>
    </div>
    // </Content>
  )
}
