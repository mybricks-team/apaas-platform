import React from 'react';
import {observe, useComputed} from '@mybricks/rxui';

import Ground from './ground';
import Trash from './trash';
import Group from "./group";
import InlineApp from './inlineApp';
import MyProjects from './myProjects';
import RunningTaskPanel from './tasks';
import WorkspaceContext, {APP_DEFAULT_ACTIVE_MENUID} from '../WorkspaceContext';

import css from './index.less';

let wsCtx: WorkspaceContext
export default function Projects(): JSX.Element {
  wsCtx = observe(WorkspaceContext, {from: 'parents'})

  return (
    <div className={css.body}>
      <Render/>
    </div>
  );
}

/** 渲染项目内容 */
function Render(): JSX.Element {
  let JSX: JSX.Element | null = null;

  const {user, appPath, APPSMap} = wsCtx;

  const app = appPath && APPSMap[appPath];

  if (app) {
    /** 安装的应用 */
    JSX = (
      <InlineApp app={app}/>
    );
  } else {
    /** 平台默认的应用 */
    switch (appPath) {
      case 'my-project':
        JSX = (
          <MyProjects user={user} urlPrefix={`?app=${appPath}`}/>
        );
        break;
      case 'ground':
        JSX = (
          //@ts-ignore
          <Ground/>
        );
        break;
      case 'running-task':
        JSX = (
          <RunningTaskPanel user={user}/>
        );
        break;
      case 'trash':
        JSX = (
          //@ts-ignore
          <Trash/>
        );
        break;
      case 'group':
        JSX = (
          <Group user={user} urlPrefix={`?app=${appPath}`}/>
        )
        break;
      default:
        break;
    }
  }

  if (!JSX) {
    wsCtx.gotoApp(APP_DEFAULT_ACTIVE_MENUID);
  }

  return JSX || <div>当前页面不存在，跳转回“我的项目”</div>;
}

/** 内容区 */
export function Content({title, children}) {
  return (
    <>
      <Block>
        <div className={css.title}>{title}</div>
      </Block>
      {children}
    </>
  );
}

/** 块 */
export function Block({style = {}, children}): JSX.Element {
  return (
    <div style={{marginBottom: 11, ...style}}>
      {children}
    </div>
  );
}
