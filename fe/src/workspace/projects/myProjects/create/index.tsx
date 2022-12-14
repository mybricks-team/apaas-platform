import React, { useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useObservable } from 'rxui-t';
// 搭建地址 https://mybricks.world/app-cloud-com.html?id=197
import CreateFileCloudCdm from "@mybricks-cloud/myspace-new-cloudcdm-project";
// 搭建地址 https://mybricks.world/app-cloud-com.html?id=243
import CreateFile from '@mybricks-cloud/create-application';

import { IconAppPCPage } from '../../../icon';
import { ChildPanelProps } from '..';
import { getApiUrl } from '../../../../utils';
// import { APPS, APPSMap } from '../../../constants';
import WorkspaceContext, { T_App, JOBS_USE_EMAILS } from '../../../WorkspaceContext';

import css from './index.less';

/** 创建项目 */
export function Create({ user, ctx }: ChildPanelProps): JSX.Element {
  const createCtx = useObservable({ app: null });
  /** TODO 云组件创建弹窗的显示隐藏，后续所有应用创建应该统一？ */
  // const [visible, setVisible] = useState<boolean | number>(1);
  const [createFileVisible, setCreateFileVisible] = useState<any>(1);

  /** 点击新建 */
  const newProject: (app: any) => void = useCallback((app: T_App) => {
    createCtx.app = app;
    setCreateFileVisible(true);
  }, []);

  /** 搭建应用列表 */
  const AppList: JSX.Element[] = useMemo(() => {
    const { DesignAPPS } = WorkspaceContext;
    return DesignAPPS.map(app => {
      const {
        icon,
        title,
        description
      } = app;
      return (
        <div
          key={app.type}
          className={css.project}
          data-namespace={app.namespace}
          data-version={app.version}
          onClick={() => newProject(app)}
        >
          <div className={css.typeIcon}>
            <div style={{ width: 32, height: 32 }}>
              {icon && <img src={icon} width={'100%'} height={'100%'} />}
            </div>
          </div>
          <div className={css.tt}>
            <label>{title}</label>
            <p>{description}</p>
          </div>
          <div className={css.snap}>
            +
          </div>
        </div>
      );
    });
  }, []);

  /** 创建应用弹窗提交事件 */
  const createFileSubmit = useCallback((value) => {
    try {
      const { name } = value;
      const { APPSMap } = WorkspaceContext;
      const { type, isSystem } = createCtx.app;
      const parentId = ctx.path[ctx.path.length - 1].id;
      const param: any = {
        userId: user.email,
        name: name,
        appType: type,
        parentId,
      }
      if(isSystem) {
        param.type = 'system';
      }
      axios({
        method: "post",
        url: getApiUrl('/api/workspace/createFile'),
        data: param
      }).then(({ data }) => {
        if (data.code === 1) {
          const appReg = APPSMap[type];
          const { homepage } = appReg;
          ctx.getAll();
          if (typeof homepage === 'string') {
            setTimeout(() => {
              window.location.href = `${homepage}?id=${data.data.id}`;
            }, 0);
          }
        } else {
          message.error(`创建文件错误：${data.message}`)
        }
      }).finally(() => {
        setCreateFileVisible(false);
      });
    } catch {
      setCreateFileVisible(false);
    }
  }, []);

  /** 创建应用弹窗关闭事件 */
  const createFileClose = useCallback(() => {
    setCreateFileVisible(false);
  }, [])

  /** 创建各类应用弹窗 */
  const RenderCreateFile: JSX.Element = useMemo(() => {
    if (typeof createFileVisible === 'number') {
      return <></>;
    }
    return (
      <div style={{ display: 'none' }}>
        <CreateFile
          title={`新建${createCtx.app.title}`}
          visible={createFileVisible}
          submit={createFileSubmit}
          close={createFileClose}
        />
      </div>
    )
  }, [createFileVisible]);

  return (
    <div className={css.news}>
      {/* {RenderNewProjectModal} */}
      {RenderCreateFile}
      {AppList}
    </div>
  );
}