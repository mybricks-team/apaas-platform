import React, { useCallback, useEffect } from 'react'

import axios from 'axios'
import {evt, observe, useObservable} from '@mybricks/rxui'

import {Title} from '..'
import AppCtx from '../../../../AppCtx'
import {Icon} from '../../../../components'
import {getApiUrl} from '../../../../../utils'



import css from './index.less'

class Ctx {
  getInfo: (id: number) => void;
  info: null | {
    id: number;
    name: string;
    apps: Array<any>;
  }
}

export default function FolderProject(props) {
  const ctx = useObservable(Ctx, next => next({
    getInfo(id) {
      return new Promise((resolve) => {
        axios({
          method: "get",
          url: getApiUrl(`/paas/api/file/getFolderProjectInfoByProjectId?id=${id}`)
        }).then(({data: {data}}) => {
          ctx.info = {...data, apps: data.apps.map((app) => {
            const {groupId, parentId} = app
            return {
              ...app,
              positionSearch: `?appId=files${groupId ? `&groupId=${groupId}` : ''}${parentId ? `&parentId=${parentId}` : ''}`
            }
          })}
          resolve(true)
        })
      })
    }
  }), {to: 'children'})
  const {info} = ctx

  useEffect(() => {
    ctx.getInfo(props.id)
  }, [])

  

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

  const btnClick = useCallback((app, appReg, type) => {
    switch (type) {
      case 'edit':
        const {homepage} = appReg
        const {id} = app
        window.location.href = `${homepage}?id=${id}`
        break
      case 'gotoPublish':
        try {
          window.open(JSON.parse(app.pubInfo.content).url)
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
    return (
      <div className={css.appCard}>
        <div className={css.title}>
          <Icon icon={appReg.icon} width={20} height={20}/>
          <div className={css.appName}>
            {app.name}
          </div>
        </div>
        <div className={css.flex}>
          <div className={css.statusContent}>
            <div className={pubInfo ? css.publishStatus : css.noPublishStatus}/>
          </div>
          <div className={pubInfo ? css.publishContent : css.noPublishContent}>{pubInfo ? '已发布' : '未发布'}</div>
        </div>
        <div className={css.footBtns}>
          <button onClick={evt(() => btnClick(app, appReg, 'edit')).stop}>编辑</button>
          <button disabled={!pubInfo} onClick={evt(() => btnClick(app, appReg, 'gotoPublish')).stop}>查看</button>
          <button disabled={positionSearch === locationSearch} onClick={evt(() => btnClick(app, appReg, 'gotoDir')).stop}>前往目录</button>
        </div>
      </div>
    )
  })
}
