import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  message,
  Menu,
  Form,
  Select,
  Input,
} from 'antd'
import axios from 'axios'
import { useComputed } from 'rxui-t'
import { getApiUrl } from '../../../utils'
import WorkspaceContext from '../../WorkspaceContext'
import { SettingOutlined } from '@ant-design/icons'

import styles from './index.less'

const Tabs = ({ onClick, activeKey, items = [] }) => {
  if (!Array.isArray(items)) {
    return null
  }

  return (
    <div className={styles.tabs}>
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
  const [activeKey, setActiveKey] = useState('system')
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
          <Form.Item initialValue="about.html" label="首页" name="platformHome" required rules={[{ required: true, type:'string', message: '请设置首页' }]}>
            <Select
              options={[
                {
                  value: 'about.html',
                  label: 'Mybricks介绍页',
                },
                {
                  value: 'login.html',
                  label: '登录页',
                }
              ]}
            >
            </Select>
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
    const keyJumpMap = {};
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
        keyJumpMap[app.namespace] = urlPath;
      }
    })
    setKeyJumpMap(keyJumpMap);
    setMenuItems(newMenuItems)
  }, [])

  const renderContent = () => {
    if (activeKey === 'system') {
      return <GlobalForm />
    } else {
      return (
        // <div style={{ padding: '12px' }}>
        <iframe
          src={keyJumpMap[activeKey]}
          frameborder="no"
          border="0"
          style={{
            minHeight: '500px',
            width: '100%',
          }}
        />
        // </div>
      )
    }
  }

  return (
    <div className={`${styles.configModal} fangzhou-theme`}>
      {/*<div className={styles.title}>设置</div>*/}
      <div className={styles.configContainer}>
        <Tabs
          onClick={(e) => {
            setActiveKey(e.key)
          }}
          activeKey={activeKey}
          items={menuItems}
        />
        <div className={styles.setting}>{renderContent()}</div>
      </div>
    </div>
  )
}
