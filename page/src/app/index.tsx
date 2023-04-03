import React, {useMemo, useState} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {useObservable} from '@mybricks/rxui'

import AppCtx from './AppCtx'
import Sideber from './sidebar'
import Content from './content'
import Noaccess from './noaccess'
import {getApiUrl, getUrlQuery} from '../utils'

import css from './index.less'

export default function App() {

  const appCtx = useObservable(AppCtx, {to: 'children'})

    /** 获取应用loading状态 */
    const [loading, setLoading] = useState(true)
    const [logo, setLogo] = useState('')
    const [access, setAccess] = useState(false)
  
    useMemo(() => {
      /** 初始化(获取应用、配置和角色) */
      (async () => {
        // // todo: 暂时注释，等待前端修复
        // const user = await API.User.getLoginUser()
        const user = (await axios({
          method: "post",
          url: '/paas/api/user/signed'
        }))?.data?.data
        if (!user) {
          location.href = `/?redirectUrl=${encodeURIComponent(location.href)}`
          return
        }
        // 平台配置
        const systemConfig = (await axios({
          method: "post",
          url: getApiUrl('/paas/api/config/get'),
          data: {
            scope: ["system"]
          }
        })).data;
        if (systemConfig?.code === 1) {
          setLogo(systemConfig?.data?.system?.config?.logo)
        }

        if(systemConfig?.data?.system?.config?.openSystemWhiteList) {
          setAccess(user.role > 1)
        } else {
          setAccess(true)
        }
        appCtx.setSystemConfig(systemConfig?.data?.system?.config)
        // /** 设置用户信息 */
        appCtx.setUser(user)
        appCtx.setIsAdministrator(!!user?.isAdmin)
  
        /** 平台安装的应用 */
        const appRes = await axios({
          method: "get",
          url: getApiUrl('/api/apps/getInstalledList')
        })
        const {code, data} = appRes.data
        if (code === 1) {
          appCtx.setApps(data)
        } else {
          message.error('获取安装应用信息失败')
        }
  
      })().finally(() => {
        setLoading(false)
      }).catch((err) => {
        message.error(err?.message ?? '初始化信息失败');
      })


      const urlQuery = getUrlQuery()

      appCtx.urlQuery = urlQuery
      appCtx.locationSearch = location.search

      function historyChange() {
        const hashKey = {}

        Object.keys(appCtx.urlQuery).forEach((key) => {
          hashKey[key] = true
        })

        const urlQuery = getUrlQuery()
        Object.keys(urlQuery).forEach((key) => {
          Reflect.deleteProperty(hashKey, key)
          appCtx.urlQuery[key] = urlQuery[key]
        })

        Object.keys(hashKey).forEach((key) => {
          appCtx.urlQuery[key] = null
        })
        
        appCtx.locationSearch = location.search
      }

      window.addEventListener('popstate', historyChange)

      const _pushState = window.history.pushState

      history.pushState = (...args) => {
        const [,,url] = args

        if (location.search !== url) {
          _pushState.call(window.history, ...args)
          historyChange()
        }
      }
    }, [])

    return loading ? (
      <div className={css.loadingContainer}>
        <div className={css.loadingText}>
          加载中，请稍后...
        </div>
      </div>
    ) : (
      access ? (
        <div className={css.app}>
          <Sideber logo={logo}/>
          <div className={css.content}>
            <Content />
          </div>
        </div>
      ) : (
        <Noaccess />
      )
    )
}
