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
  Switch
} from 'antd'
import axios from 'axios'
import {observe} from '@mybricks/rxui'
import {SettingOutlined, LeftOutlined, InfoCircleOutlined} from '@ant-design/icons'

import compareVersion from 'compare-version'
import {getApiUrl} from '../../../utils'
import AppCtx, { T_App } from '../../AppCtx'
import SchemaSetting, {SettingItem} from './schemaSetting'

interface MenuItem extends T_App {
  icon: any
  setting?: SettingItem[] | string
}

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
  breakCount: number
}

const Tabs = ({ onClick, activeKey, items = [], style }: TabsProps) => {
  if (!Array.isArray(items)) {
    return null
  }
  let group1 = [];
  let group2 = [];
  items?.forEach((item, index) => {
    let temp = (
      <div
          key={item.namespace}
          className={`${styles.tab} ${activeKey === item.namespace ? styles.activeTab : ''
            }`}
          onClick={() => onClick?.({ namespace: item.namespace })}
        >
          <div className={styles.icon}>{item?.icon}</div>
          <div className={styles.label}>{item?.title}</div>
      </div>
    );
    if(index <= 1) {
      group1.push(temp)
    } else {
      group2.push(temp)
    }
  })
  return (
    <div className={styles.tabs} style={style}>
      <div style={{display: 'flex'}}>
        {...group1}
      </div>
      <div style={{display: 'flex'}}>
        {...group2}
      </div>
    </div>
  )
}

const GlobalForm = ({ initialValues, onSubmit, style }) => {
  const [form] = Form.useForm()
  const [openSystemWhiteListSwitch, setOpenSystemWhiteListSwitch] = useState(initialValues?.openSystemWhiteList)

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
        {/* <Form.Item
          initialValue="login.html"
          label="首页"
          name="platformHome"
          required
          rules={[{ required: true, type: 'string', message: '请设置首页' }]}
        >
          <Select
            options={[
              // {
              //   value: 'about.html',
              //   label: 'Mybricks介绍页',
              // },
              {
                value: 'login.html',
                label: '登录页',
              },
            ]}
          ></Select>
        </Form.Item> */}
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
          initialValue=""
          label="ChatGpt凭证"
          name="chatGptToken"
        >
          <Input />
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
          initialValue=""
          label="应用白名单"
          name="appWhiteList"
        >
          <Input.TextArea rows={2} placeholder='默认开放应用白名单' />
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

const AboutForm = ({ currentPlatformVersion }) => {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeInfo, setUpgradeInfo] = useState(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  let upgradeContainer = null;
  if(showUpgrade) {
    upgradeContainer = (
      <div style={{display: 'flex', justifyContent: 'space-around', alignItems:'center', marginTop: 8}}>
        <span>最新版本是: {upgradeInfo.version}</span>
        <Button 
          type="primary" 
          loading={isDownloading}
          onClick={() => {
            setIsDownloading(true)
            message.info('正在执行下载操作', 3)
              axios.post(getApiUrl('/paas/api/system/channel'), {
                type: 'downloadPlatform',
                version: upgradeInfo.version
              }).then((res) => {
                if(res?.data?.code === 1) {
                  message.info('安装包下载完毕，即将执行升级操作，请稍后', 3)
                  axios.post(getApiUrl('/paas/api/system/channel'), {
                    type: 'reloadPlatform',
                    version: upgradeInfo.version
                  }).then((res) => {
                    setTimeout(() => {
                      message.info('升级中，请稍后，此过程大约15s', 15, () => {
                        message.success('升级成功, 3秒后将自动刷新页面', 3, () => {
                          location.reload()
                          setIsDownloading(false)
                        })
                      })
                    }, 3000)
                  }).catch(e => {
                    setIsDownloading(false)
                    console.log(e)
                  })
                }
              }).catch(e => {
                setIsDownloading(false)
                console.log(e)
              })
          }}
        >
          立即升级?
        </Button>
      </div>
    )
  }
  return (
    <div>
      <p style={{textAlign: 'center', fontSize: 22, fontWeight: 700}}>MyBricks aPaaS Platform</p>
      <p style={{textAlign: 'center'}}>Version {currentPlatformVersion}</p>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <Button
          loading={checkLoading}
          onClick={() => {
            // console.log('点击检查更新')
            setCheckLoading(true)
            axios.post(getApiUrl('/paas/api/system/channel'), {
              type: "checkLatestPlatformVersion",
            }).then(({ data }) => {
              console.log('最新版本', data)
              if(data.code === 1) {
                const temp = compareVersion(data.data.version, currentPlatformVersion)
                switch(temp) {
                  case -1: {
                    message.info('远程系统版本异常，请联系管理员')
                    break;
                  }
                  case 0: {
                    message.info('当前版本已是最新版本')
                    break;
                  }
                  case 1: {
                    setUpgradeInfo(data.data)
                    setShowUpgrade(true)
                    break
                  }
                }
              } else {
                message.info(data.msg)
              }
              setCheckLoading(false)
            })
          }}
        >
            检查更新
          </Button>
      </div>
      {upgradeContainer}
    </div>
  )
}

export default () => {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const user = appCtx.user
  const [activeKey, setActiveKey] = useState()
  const [configMap, setConfigMap] = useState({})

  const [isConfigMount, setIsConfigMount] = useState(false)
  const [currentPlatformVersion, setCurrentPlatformVersion] = useState('');

  const menuItems = useMemo((): MenuItem[] => {
    let defaultItems = [
      { title: '全局设置', namespace: 'system', icon: <SettingOutlined /> },
      { title: '关于', namespace: 'about', icon: <InfoCircleOutlined /> }
    ]
    if (!Array.isArray(appCtx.InstalledAPPS)) {
      return defaultItems
    } else {
      const appSettings = appCtx.InstalledAPPS.filter(
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
    ; (async () => {
      const res = await axios({
        method: 'post',
        url: getApiUrl('/paas/api/config/get'),
        data: {
          scope: menuItems.map((t) => t.namespace),
        },
      })
      const { code, data } = res?.data || {}
      if (code === 1) {
        setConfigMap(data)
        setIsConfigMount(true)
      }
    })().catch((err) => {
      message.error(err.message || '查询设置失败')
    })
  }, [menuItems])

  const submitConfig = useCallback(
    (namespace, values) => {
      ; (async () => {
        const res = await axios({
          method: 'post',
          url: getApiUrl('/paas/api/config/update'),
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

  useEffect(() => {
    axios.post(getApiUrl('/paas/api/system/channel'), {
      type: "getCurrentPlatformVersion",
    }).then(({ data }) => {
      if(data.code === 1) {
        setCurrentPlatformVersion(data.data)
      }
    })
  }, [])

  const renderContent = () => {
    switch (true) {
      case !isConfigMount: {
        return '配置初始化中...'
      }
      case !activeKey: {
        return null
      }
      /** 系统设置 */
      case activeKey === 'system': {
        return (
          <GlobalForm
            style={{ paddingTop: 20 }}
            initialValues={configMap?.[activeKey]?.config}
            onSubmit={(values) => {
              submitConfig(activeKey, values)
            }}
          />
        )
      }
      case activeKey === 'about': {
        return (
          <AboutForm currentPlatformVersion={currentPlatformVersion} />
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
              src={`/${activeItem.namespace}/${activeItem?.setting}`}
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
                paddingTop: 20,
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
      <div className={styles.configContainer}>
        <Tabs
          style={{ display: !activeKey ? 'block' : 'none' }}
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
