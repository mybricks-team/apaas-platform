import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import {evt, observe, useObservable} from '@mybricks/rxui';
import {Card, Title} from '..';
import AppCtx from '../../../../AppCtx';
import {Icon} from '../../../../components';
import {getApiUrl} from '../../../../../utils';
import ModuleCenterModal from './module-center-modal';
import { Server } from '../../../../noaccess/Icons';

import css from './index.less';
import { message, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';

class Ctx {
	id: number;
  getInfo: (id: number) => void;
  info: null | {
    id: number;
    name: string;
    apps: Array<any>;
  };
	moduleList: { name: string; id: number; version: string }[];
}

export default function FolderProject(props) {
  const appCtx = observe(AppCtx, {from: 'parents'})
	const ctx = useObservable(Ctx, next => next({
		id: props.id,
		getInfo() {
			return new Promise((resolve) => {
				axios({
					method: "post",
					url: getApiUrl(`/paas/api/file/getFolderProjectInfoByProjectId`),
          data: {
            id: props.id,
            userName: appCtx?.user?.email
          }
				}).then(({data: {data}}) => {
					ctx.info = {
						...data,
						apps: data.apps.map((app) => {
							const {groupId, parentId, pubInfo} = app
              console.log('111', pubInfo)
							return {
								...app,
                pubInfo: pubInfo ? {
                  ...pubInfo,
                } : null,
								positionSearch: `?appId=files${groupId ? `&groupId=${groupId}` : ''}${parentId ? `&parentId=${parentId}` : ''}`
							}
						}),
					};
					ctx.moduleList = data.moduleList ?? []
					resolve(true)
				})
			})
		}
	}), {to: 'children'});
	
	useEffect(() => {
		ctx.getInfo()
	}, []);
	
	return (
		<div className={css.folderProjectContainer}>
			<FolderProjectList info={ctx.info} />
      <div>
        <ModuleArea ctx={ctx} />
        <SuperAdminInfoArea ctx={ctx} />
        <ContainerArea />
      </div>
		</div>
	);
}

function FolderProjectList(props) {
  const { info } = props;

  return (
    <div className={css.container}>
      <Title content={info?.name}/>
      {/* TODO: AppList 内部滚动 */}
      {info?.apps.length ? <AppList apps={info.apps}/> : (
        <div style={{
          color: '#AAA',
          fontSize: 12
        }}>
          {/* TODO:  */}
          当前项目下没有PC网站...
        </div>
      )}
    </div>
  )
}

function AppList({apps}) {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const {APPSMap, locationSearch} = appCtx

  const btnClick = useCallback((app, appReg, type, envType?: 'staging' | 'prod') => {
    switch (type) {
      case 'edit':
        const {homepage} = appReg
        const {id} = app
        window.location.href = `${homepage}?id=${id}`
        break
      case 'gotoPublish':
        try {
          console.log(app.pubInfo)
          if(envType === 'staging' || envType === 'prod') {
            let content = app.pubInfo?.[envType]?.content;
            if(content) {
              content = JSON.parse(content)
              window.open(content.main.url)
            }
          }
        } catch(e) {
          console.error(e)
        }
        break
      case 'gotoDir':
        const {positionSearch} = app
        history.pushState(null, '', positionSearch)
        break
      default:
        break
    }
  }, [])

  return apps.map((app) => {
    const {extName, pubInfo, positionSearch} = app
    const appReg = APPSMap[extName]

    const _getPublishMenuItems = () => {
      const envs: any[] = Object.keys(app.pubInfo)
      const hansMap = {
        staging: '日常环境',
        prod: '线上环境'
      }
      return envs.map(env => {
        return {
          label: (
            <span onClick={evt(() => btnClick(app, appReg, 'gotoPublish', env)).stop}>
              {hansMap[env]}
            </span>
          ),
          key: env,
        }
      })
    }

    const items = _getPublishMenuItems()
    const alreadyPublish = items.length > 0;
    return (
      <Card>
        <div className={css.title}>
          <Icon icon={appReg.icon} width={20} height={20}/>
          <div className={css.appName}>
            {app.name}
          </div>
        </div>
        <div className={css.flex}>
          <div className={css.statusContent}>
            <div className={alreadyPublish ? css.publishStatus : css.noPublishStatus}/>
          </div>
          <div className={alreadyPublish ? css.publishContent : css.noPublishContent}>{alreadyPublish ? '已发布' : '未发布'}</div>
        </div>
        <div className={css.footBtns}>
          <button onClick={evt(() => btnClick(app, appReg, 'edit')).stop}>编辑</button>
          <Dropdown
            disabled={!alreadyPublish}
            menu={{ items: items}}
          >
            <button>
              <Space>
                查看
                <DownOutlined />
              </Space>
            </button>
          </Dropdown>
          <button disabled={positionSearch === locationSearch} onClick={evt(() => btnClick(app, appReg, 'gotoDir')).stop}>前往目录</button>
        </div>
      </Card>
    )
  })
}

function ContainerArea() {
  const [isReload, setIsReload] = useState(false)
  return (<div className={css.containerArea}>
      <Card>
        <div className={css.title}>
          <span className={css.titleIcon}>
            { Server }
            <span style={{marginLeft: 4}}>运行容器状态</span>
          </span>
        </div>
        <div style={{display: 'inline-flex'}}>
          <div className={css.statusContent}>
            <div className={isReload ? css.reloadStatus : css.runStatus}/>
          </div>
          <div className={isReload ? css.serverReload : css.serverOnline}>{isReload ? '重启中' : '运行中'}</div>
        </div>
        <div className={css.footBtns}>
          <button disabled={isReload} onClick={() => {
            setIsReload(true);
            message.info('服务重启中, 请稍后', 2)
            axios({
              method: "post",
              url: getApiUrl(`/runtime/api/server/reload`)
            }).then(({data}) => {
              setTimeout(() => {
                if(data.code === 1) {
                  message.success('重启完毕')
                } else {
                  message.warn('重启失败，请重试')
                }
                setIsReload(false);
              }, 5000)
            }).catch(e => {
              message.warn('出错了，请重试' + e.message)
              setIsReload(false);
            })
          }}>重启服务</button>
        </div>
      </Card>
  </div>)
}

function ModuleArea({ ctx }) {
	const [showModal, setShowModal] = useState(false);
	const onClose = useCallback(() => setShowModal(false), []);
	
	return (
		<>
			<div className={css.moduleArea}>
				{ctx.moduleList?.length ? (
					<>
						<Title content="已安装模块" />
						<div className={css.moduleList}>
							{ctx.moduleList.map(module => {
								return (
									<div className={css.moduleItem} key={module.id}>
										<div className={css.moduleName}>{module.name}</div>
										<div className={css.moduleVersion}>@{module.version}</div>
									</div>
								);
							})}
						</div>
					</>
				) : null}
				<button onClick={() => setShowModal(true)}>添加模块</button>
			</div>
			<ModuleCenterModal installedModuleList={ctx.moduleList || []} onFinish={ctx.getInfo} projectId={ctx.id} visible={showModal} onClose={onClose} />
		</>
	);
}

function SuperAdminInfoArea({ ctx }) {
  const showAdminArea = ctx.info?.adminInfo ? true : false
  if(!showAdminArea) {
    return null
  } 
  return (
    <div className={css.adminInfoArea}>
        <Card>
          <div className={css.title}>
            <span className={css.titleIcon}>
              <span style={{marginLeft: 4}}>站点超级管理员信息</span>
            </span>
          </div>
          <div style={{cursor: 'text', userSelect: 'text'}}>
            <p className={css.statusContent}>账号</p>
            <p className={css.statusContent}>{ctx?.info?.adminInfo?.userName}</p>
            <p className={css.statusContent}>密码</p>
            <p className={css.statusContent}>{ctx?.info?.adminInfo?.password}</p>
            <p>超管登陆地址</p>
            {
              ctx.info?.apps?.map(app => {
                return <a href={`${location.origin}${app.adminLoginBasePath}`}>{app.name}</a>
              })
            }
          </div>
        </Card>
    </div>
  )
}