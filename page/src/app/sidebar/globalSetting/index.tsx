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
} from 'antd'
import axios from 'axios'
import {observe} from '@mybricks/rxui'
import Icon, {SettingOutlined, LeftOutlined, InfoCircleOutlined} from '@ant-design/icons'
import { APaaS } from '../../noaccess/Icons'

import compareVersion from 'compare-version'
import {getApiUrl} from '../../../utils'
import AppCtx, { T_App } from '../../AppCtx'
import SchemaSetting, {SettingItem} from './schemaSetting'

interface MenuItem extends T_App {
  icon: any
  setting?: SettingItem[] | string
}

import styles from './index.less'
import Term from './term'

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
    if(index <= 3) {
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

const OssForm = ({ initialValues, onSubmit, style }) => {
  const [form] = Form.useForm()

  const openOss = Form.useWatch('openOss', form);

  useEffect(() => {
    if (!initialValues) {
      return
    }
    form?.setFieldsValue?.({
      ...initialValues
    })
  }, [initialValues])

  return (
    <div className={styles.globalForm} style={style}>
      <Form
        form={form}
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 19 }}
        labelAlign="top"
        autoComplete="off"
      >
        <Form.Item
          initialValue=""
          label="开启OSS上传"
          name="openOss"
          extra="开启后搭建应用内的资源（比如图片）将会上传到OSS系统中"
        >
          <Switch checked={openOss} />
        </Form.Item>
        {
          openOss && (
            <>
            <Form.Item
              initialValue="aliyun"
              label="平台"
              name="platform"
              required
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  {
                    value: 'aliyun',
                    label: '阿里云',
                  },
                ]}
              />
            </Form.Item>
              <Form.Item
                initialValue=""
                label="accessKeyId"
                name="accessKeyId"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="accessKeySecret"
                name="accessKeySecret"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="地域 (Region Id)"
                name="region"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="存储空间 (Bucket)"
                name="bucket"
                rules={[{ required: true }]}
              >
                <Input placeholder='' />
              </Form.Item>
              <Form.Item
                initialValue=""
                label="CDN域名"
                name="cdnDomain"
              >
                <Input placeholder='' />
              </Form.Item>
            </>
          )
        }
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          style={{ position: 'absolute', right: 0 }}
          type="primary"
          onClick={() => {
            form?.validateFields().then((values) => {
              typeof onSubmit === 'function' && onSubmit({
                ...(values ?? {})
              })
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
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [versionCompareResult, setVersionCompareResult] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  let upgradeContainer = null;

  const upgrade = useCallback((version) => {
    setIsDownloading(true)
      message.info('正在执行下载操作, 此过程大约15s', 15)
      axios.post(getApiUrl('/paas/api/system/channel'), {
        type: 'downloadPlatform',
        version: version,
        userId: appCtx.user?.id,
      }).then((res) => {
        if(res?.data?.code === 1) {
          message.info('安装包下载完毕，即将执行升级操作，请稍后', 5)
          axios.post(getApiUrl('/paas/api/system/channel'), {
            type: 'reloadPlatform',
            version: version,
            userId: appCtx.user?.id,
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
  }, [])
  
  if(showUpgrade) {
    // console.log(111, versionCompareResult)
    upgradeContainer = (
      <div style={{display: 'flex', justifyContent: 'space-around', alignItems:'center', marginTop: 8}}>
        {
          versionCompareResult > 0 ? (
            <div style={{display: 'flex', justifyContent: 'space-around', alignItems:'center', width: 300}}>
              <span>最新版本是: <span style={{ color: 'rgb(255, 77, 79)' }}>{upgradeInfo.version}</span></span>
              <Button 
                loading={isDownloading}
                onClick={() => {
                  upgrade(upgradeInfo.version)
                }}
              >
                立即升级?
              </Button>
            </div>
          ) : null
        }
        {
          upgradeInfo?.previousList?.length > 0 ? (
            <Popover 
              content={(
                <div
                  style={{display: 'flex', flexDirection: 'column'}} 
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentApp = upgradeInfo?.previousList?.[e.target?.dataset?.index];
                    upgrade(currentApp.version)
                  }}>
                    {
                      upgradeInfo?.previousList?.map((item, index) => {
                        return (
                          <p data-index={index} style={ isDownloading ? {marginTop: 8, color: 'gray', cursor: 'not-allowed'} : {marginTop: 8, color: '#ff4d4f', cursor: 'pointer'}}>回滚到：{item.version} 版本</p>
                        )
                      })
                    }
                  </div>
              )} 
              title="历史版本" 
              trigger="click"
            >
              <Button
                type={"link"}
                disabled={isDownloading}
                className={styles.button}
                style={{ marginLeft: 10 }}
              >
                历史版本
              </Button>
            </Popover>
          ) : null
        }
      </div>
    )
  }
  return (
    <div>
      <p style={{textAlign: 'center', fontSize: 32, fontWeight: 700, display: 'flex', alignItems:'center', justifyContent: 'center'}}> 
      <span style={{ marginRight: 8 }}>
        { APaaS }
      </span>
       Platform</p>
      <p style={{textAlign: 'center'}}>当前平台版本 <span style={{color: 'rgb(22, 119, 255)'}}>{currentPlatformVersion}</span></p>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 8}}>
        <Button
          loading={checkLoading}
          onClick={() => {
            setCheckLoading(true)
            axios.post(getApiUrl('/paas/api/system/channel'), {
              type: "checkLatestPlatformVersion",
              userId: appCtx.user?.id,
            }).then(({ data }) => {
              console.log('最新版本', data)
              if(data.code === 1) {
                const temp = compareVersion(data.data.version, currentPlatformVersion)
                setVersionCompareResult(temp)
                switch(temp) {
                  case -1: {
                    message.info('远程系统版本异常，请联系管理员')
                    break;
                  }
                  case 0: {
                    message.info('当前版本已是最新版本')
                    setUpgradeInfo(data.data)
                    setShowUpgrade(true)
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

const OssIcon = (props) => {
  return (
    <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M901 459.4c-38.7-35.8-87.6-47.2-120.6-50.6-1.8-68.6-23.1-126.2-63.5-171.6-78.4-88.1-199.9-95.6-208-95.9-176.9 6.1-250.8 138-270.5 226C102.9 387.1 64.3 499.5 63.3 560.2 63.3 722 188.8 772 256.7 775.9c91.2-0.3 160.7-23.5 207.3-73.5 39.8-42.6 52.8-93.7 56.9-128.1l75.3 68.1 45.2-49.9L492 457.4 338.3 574.1l40.7 53.6 74.4-56.5c-3.4 23.9-12.9 57.8-38.6 85.3-33.2 35.6-86.1 52.4-155.6 52.2-13.2-0.9-128.6-12.8-128.6-147.9 0.1-5 3.6-122 138.3-128.8l28.7-1.5 3.1-28.5c0.8-7.6 22.6-186.9 207.4-193.4 1 0.1 99.4 6.6 158.8 73.7 34.4 38.9 49.7 91.6 45.5 156.9l-2.3 38.4 38.4-2.7c0.8 0 65.7-4.2 107 34.2C879.2 531 891.4 564 892 607c-3.5 15.8-24.7 94.7-99.5 101.6H532V776l263.4-0.2C904.5 766 950 667 958.9 616l0.5-5.7c-0.1-64.5-19.7-115.2-58.4-150.9z" fill="#555555" p-id="8000"></path></svg>
  )
}

const LogIcon = (props) => {
  return (
    <svg t="1692865352242" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4055" width="200" height="200"><path d="M819.9 472.9L675 723.9l1.7 99.4 86.9-48.3 144.9-251-88.6-51.1zM871.1 384.3L837 443.4l88.6 51.1 34.1-59.1-88.6-51.1zM544.3 703h-288c-17.7 0-32 14.3-32 32s14.3 32 32 32h288c17.7 0 32-14.3 32-32s-14.3-32-32-32zM256.3 511c-17.7 0-32 14.3-32 32s14.3 32 32 32h384c17.7 0 32-14.3 32-32s-14.3-32-32-32h-384zM256.3 319c-17.7 0-32 14.3-32 32s14.3 32 32 32h384c17.7 0 32-14.3 32-32s-14.3-32-32-32h-384zM288 64h64v160h-64zM384 128h128v64H384zM544 64h64v160h-64z" p-id="4056"></path><path d="M768 864c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32h96v-64h-96c-53 0-96 43-96 96v640c0 53 43 96 96 96h576c53 0 96-43 96-96V686.7L768 798v66zM832 224c0-53-43-96-96-96h-96v64h96c17.7 0 32 14.3 32 32v311l64-111.3V224z" p-id="4057"></path></svg>
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
      { title: '存储设置', namespace: 'mybricks-oss-config', icon: <OssIcon />},
      { title: '运行日志', namespace: 'mybricks-log', icon: <LogIcon />},
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
            userId: user.id,
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
      userId: appCtx.user?.id,
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
      case activeKey === 'mybricks-oss-config': {
        return (
          <OssForm
            style={{ paddingTop: 20 }}
            initialValues={configMap?.[activeKey]?.config}
            onSubmit={(values) => {
              submitConfig(activeKey, values)
            }}
          />
        )
      }
      case activeKey === 'mybricks-log': {
        return (
          <Term />
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
