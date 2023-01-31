import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useComputed } from 'rxui-t';
import * as API from '@mybricks/sdk-for-app/src/api';

import Projects from './projects';
import LoginCtx from '../LoginCtx';
import { getApiUrl } from '../utils';
import Docker from './docker/Docker';
import WorkspaceContext from './WorkspaceContext';

// @ts-ignore
import css from './Workspace.less';

/** 工作区 (我的空间) */
export default function Workspace(): JSX.Element {

  /** 获取应用loading状态 */
  const [loading, setLoading] = useState(true);
  const [customLogo, setCustomLogo] = useState("");

  useMemo(() => {
    /** 登录状态 */
    const loginCtx = LoginCtx.init();

    if (!loginCtx.curUser) {
      location.href = "/";
      return;
    }

    /** 设置用户信息 */
    WorkspaceContext.setUser(loginCtx.curUser);

    /** 初始化(获取应用、配置和角色) */
    ; (async () => {
      const user = await API.user.getUserInfo()

      WorkspaceContext.setIsAdministrator(!!user?.isAdmin)

      const appRes = await axios({
        method: "get",
        url: getApiUrl('/api/apps/getInstalledList')
      })
      const { code, data } = appRes.data;
      if (code === 1) {
        WorkspaceContext.setApps(data);
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
      console.error( systemConfig.data );
      if(systemConfig?.data?.code === 1){
        setCustomLogo(systemConfig?.data?.data?.system?.config?.logo);
      }

    })().finally(() => {
      setLoading(false);
    }).catch((err) => {
      message.error(err?.message ?? '初始化信息失败');
    });
  }, []);

  return (
    <div className={css.view}>
      {loading ? (
        <div>加载中...</div>
      ) : !WorkspaceContext.user ? (
        <div>
          请登录
        </div>
      ) : (
        <>
          <Docker customLogo={customLogo} />
          <div className={css.main}>
            <Projects />
          </div>
        </>
      )}
    </div>
  );
}
