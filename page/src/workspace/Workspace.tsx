import React, {useMemo, useState} from 'react';
import axios from 'axios';
import {message} from 'antd';
import API from '@mybricks/sdk-for-app/src/api';

import Projects from './projects';
import LoginCtx from '../LoginCtx';
import {getApiUrl} from '../utils';
import Docker from './docker/Docker';
import WorkspaceContext from './WorkspaceContext';

import css from './Workspace.less';
import {useObservable} from "@mybricks/rxui";
import {getUrlQuery} from '../utils'

/** 工作区 (我的空间) */
export default function Workspace(): JSX.Element {
  const wsCtx = useObservable(WorkspaceContext, {to: "children"})

  /** 获取应用loading状态 */
  const [loading, setLoading] = useState(true);
  const [customLogo, setCustomLogo] = useState("");

  useMemo(() => {
    /** 初始化(获取应用、配置和角色) */
    ;(async () => {
      try {
        const user = await API.User.getLoginUser()
        console.log('login', user)
        /** 设置用户信息 */
        wsCtx.setUser(user)
        // @ts-ignore
        wsCtx.setIsAdministrator(!!user?.isAdmin)
      } catch(e) {
        message.error(e.toString());
        const count = sessionStorage.getItem('_MYBIRCKS_LOGIN_REDIRECT_COUNT_')
        if(!count) {
          sessionStorage.setItem('_MYBIRCKS_LOGIN_REDIRECT_COUNT_', count + 1)
          setTimeout(() => {
            location.href = '/'
            message.info('即将重定向到登录页')
          }, 1000)
        }
      }

      const appRes = await axios({
        method: "get",
        url: getApiUrl('/api/apps/getInstalledList')
      })
      const {code, data} = appRes.data;
      if (code === 1) {
        wsCtx.setApps(data);
      } else {
        message.error('获取安装应用信息失败');
      }

      // UI 配置
      const systemConfig = await axios({
        method: "post",
        url: getApiUrl('/paas/api/config/get'),
        data: {
          scope: ["system"]
        }
      });
      console.error(systemConfig.data);
      if (systemConfig?.data?.code === 1) {
        setCustomLogo(systemConfig?.data?.data?.system?.config?.logo);
      }

    })().finally(() => {
      setLoading(false);
    }).catch((err) => {
      message.error(err?.message ?? '初始化信息失败');
    });

    window.addEventListener("popstate", () => {
      const urlQuery = getUrlQuery();
      const { app } = urlQuery;
      if (app !== wsCtx.appPath) {
        wsCtx.gotoApp(app, false);
      }
    });
  }, []);

  return (
    <div className={css.view}>
      {loading ? (
        <div>加载中...</div>
      ) : !wsCtx.user ? (
        <div>
          请登录
        </div>
      ) : (
        <>
          <Docker customLogo={customLogo}/>
          <div className={css.main}>
            <Projects/>
          </div>
        </>
      )}
    </div>
  );
}
