import React, {
  useState,
  useCallback
} from 'react'
import compareVersion from 'compare-version'
import axios from 'axios'
import {observe} from '@mybricks/rxui'
import {QuestionCircleOutlined, InboxOutlined, GlobalOutlined, ThunderboltOutlined} from '@ant-design/icons'
import {
  Button,
  message,
  Popover,
  Upload
} from 'antd'
import { APaaS } from '../../../noaccess/Icons'
import AppCtx from '../../../AppCtx'
import {getApiUrl} from '../../../../utils'
import styles from '../index.less'

const { Dragger } = Upload;

const AboutForm = ({ currentPlatformVersion }) => {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [versionCompareResult, setVersionCompareResult] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  let upgradeContainer = null;

  const uploadProps = {
		multiple: false,
		maxCount: 1,
		showUploadList: true,
		action: getApiUrl(`/paas/api/system/offlineUpdate?userId=${appCtx.user?.id}`),
		onChange(info) {
			const { status } = info.file;
			console.log(info)
			if (status === 'done') {
				message.destroy()
				message.success(`上传成功，正在安装中, 请稍后(大概10s)`, 10);
				setTimeout(() => {
					message.success(`安装成功, 即将自动刷新`);
					setTimeout(() => {
						location.reload();
					}, 1000)
				}, 10 * 1000)
			} else if (status === 'error') {
				message.destroy()
				message.error(`上传失败`);
			}
		},
		onDrop(e) {
			console.log('Dropped files', e.dataTransfer.files);
		},
	};

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
        } else {
          setIsDownloading(false)
          message.info(res?.data?.msg || '下载失败，请稍后重试')
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
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  upgrade(upgradeInfo.version)
                }}
              >
                立即升级
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
                    // @ts-ignore
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
      <p style={{textAlign: 'center'}}>当前版本是： <span style={{color: 'rgb(22, 119, 255)'}}>{currentPlatformVersion}</span></p>
			<p style={{height: 32, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>
				在线更新&nbsp;
				<Popover
					content={'需要能够访问公网环境，点击下面检查更新按钮，即可在线更新'}
					trigger="hover"
				>
					<QuestionCircleOutlined />
				</Popover>
			</p>
      <div style={{display: 'flex', justifyContent: 'center', marginTop: 8}}>
        <Button
          loading={checkLoading}
          type='primary'
          icon={<GlobalOutlined />}
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
      <p style={{height: 32, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 10}}>
        离线更新&nbsp;
        <Popover
          content={'不需要能够访问公网环境，拖入平台安装包即可上传进行平台更新'}
          trigger="hover"
        >
          <QuestionCircleOutlined />
        </Popover>
      </p>
      <Dragger 
				{...uploadProps}
			>
				<p className="ant-upload-drag-icon">
					<InboxOutlined />
				</p>
				<p className="ant-upload-text">拖拽 平台安装包 至此</p>
				<p className="ant-upload-hint">
				</p>
			</Dragger>
    </div>
  )
}

export default AboutForm