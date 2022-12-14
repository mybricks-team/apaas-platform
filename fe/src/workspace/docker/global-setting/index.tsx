import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form, Select, Button, message } from 'antd'
import axios from 'axios'
import { useComputed } from 'rxui-t'
import { SettingOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'

import SchemaSetting, { SettingItem } from './schema-setting'

import { getApiUrl } from '../../../utils'
import WorkspaceContext, { T_App } from '../../WorkspaceContext'

interface MenuItem extends T_App {
  icon: any
  setting?: SettingItem[] | string
}

// @ts-ignore
import styles from './index.less'

interface TabsProps {
  onClick: (e: any) => void
  activeKey?: string
  items: Array<{
    title: string
    namespace: string
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
          key={item.namespace}
          className={`${styles.tab} ${
            activeKey === item.namespace ? styles.activeTab : ''
          }`}
          onClick={() => onClick?.({ namespace: item.namespace })}
        >
          <div className={styles.icon}>{item?.icon}</div>
          <div className={styles.label}>{item?.title}</div>
        </div>
      ))}
    </div>
  )
}

const GlobalForm = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (!initialValues) {
      return
    }
    form?.setFieldsValue?.(initialValues)
  }, [initialValues])

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

export default () => {
  const user = useComputed(() => WorkspaceContext.user)
  const [activeKey, setActiveKey] = useState()
  const [configMap, setConfigMap] = useState({})

  const menuItems = useMemo((): MenuItem[] => {
    let defaultItems = [{ title: '全局设置', namespace: 'system', icon: <SettingOutlined /> }]
    if (!Array.isArray(WorkspaceContext.InstalledAPPS)) {
      return defaultItems
    } else {
      const appSettings = WorkspaceContext.InstalledAPPS.filter(
        (app) => app?.setting
      ).map((app) => {
        return {
          ...app,
          icon: typeof app?.icon === 'string' ? <img src={app.icon} /> : app.icon,
        }
      })

      return [...defaultItems, ...appSettings]
    }
  }, [])

  const queryConfig = useCallback(() => {
    ;(async () => {
      const res = await axios({
        method: 'post',
        url: getApiUrl('/api/config/get'),
        data: {
          scope: menuItems.map((t) => t.namespace),
        },
      })
      const { code, data } = res?.data || {}
      if (code === 1) {
        setConfigMap(data)
      }
    })().catch((err) => {
      message.error(err.message || '查询设置失败')
    })
  }, [menuItems])

  const submitConfig = useCallback(
    (namespace, values) => {
      ;(async () => {
        const res = await axios({
          method: 'post',
          url: getApiUrl('/api/config/update'),
          data: {
            namespace: namespace,
            userId: user.email,
            config: values,
          },
        })

        const { code } = res?.data || {}
        if (code === 1) {
          message.success('保存成功')
          queryConfig()
        }
      })().catch((err) => {
        message.error(err.message || '保存设置失败')
      })
    },
    [user, queryConfig]
  )

  useEffect(() => {
    queryConfig()
  }, [queryConfig])

  const renderContent = () => {
    switch (true) {
      case !activeKey: {
        return null
      }
      /** 系统设置 */
      case activeKey === 'system': {
        if (!activeKey) {
          return null
        }
        return (
          <GlobalForm
            initialValues={configMap?.[activeKey]?.config}
            onSubmit={(values) => {
              submitConfig(activeKey, values)
            }}
          />
        )
      }
      /** 其他APP导入的设置 */
      case Boolean(activeKey): {
        const activeItem = menuItems.find(
          (item) => item.namespace === activeKey
        )

        /** 如果是html走iframe渲染 */
        if (
          typeof activeItem?.setting === 'string' &&
          activeItem?.setting.includes('.html')
        ) {
          return (
            <iframe
              src={activeItem?.setting}
              // @ts-ignore
              frameborder="no"
              border="0"
              style={{
                paddingTop: 20,
                minHeight: '500px',
                maxHeight: '90vh',
                height: 600,
                width: '100%',
              }}
            />
          )
        }

        /** 如果是数组走协议渲染 */
        if (Array.isArray(activeItem?.setting) && activeItem?.namespace) {
          return (
            <SchemaSetting
              key={activeItem?.namespace}
              initialValues={configMap?.[activeItem?.namespace]?.config}
              schema={activeItem?.setting}
              style={{
                minHeight: '500px',
                maxHeight: '90vh',
                height: 600,
                width: '100%',
              }}
              onSubmit={(values) => {
                submitConfig(activeItem?.namespace, values)
              }}
            />
          )
        }

        return null
      }
      default: {
        return null
      }
    }
  }

  const activeTitle = useMemo(() => {
    return menuItems?.find?.((t) => t.namespace === activeKey)?.title ?? '设置'
  }, [activeKey, menuItems])

  return (
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
          onClick={({ namespace }) => {
            setActiveKey(namespace)
          }}
          items={menuItems}
        />
        {renderContent()}
      </div>
    </div>
  )
}
