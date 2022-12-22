import React from 'react';
import { useComputed } from 'rxui-t';

import Ground from './ground';
import Trash from './trash';
import InlineApp from './inlineApp';
import MyProjects from './myProjects';
import RunningTaskPanel from './tasks';
import WorkspaceContext, { APP_DEFAULT_ACTIVE_MENUID } from '../WorkspaceContext';

// @ts-ignore
import css from './index.less';

export default function Projects (): JSX.Element {
  return (
    <div className={css.body}>
      <Render />
    </div>
  );
}

/** 渲染项目内容 */
function Render (): JSX.Element {
  return useComputed(() => {
    let JSX: JSX.Element | null = null;

    const { user, urlQuery: { path }, APPSMap } = WorkspaceContext;

    const app = APPSMap[path];

    if (app) {
      /** 安装的应用 */
      JSX = (
        <InlineApp app={app}/>
      );
    } else {
      /** 平台默认的应用 */
      switch (path) {
        case 'my_project':
          JSX = (
            <MyProjects user={user} />
          );
          break;
        case 'ground': 
          JSX = (
            //@ts-ignore
            <Ground />
          );
          break;
        case 'running_task':
          JSX = (
            <RunningTaskPanel user={user} />
          );
          break;
	      case 'trash':
		      JSX = (
            //@ts-ignore
			      <Trash />
		      );
		      break;
        default:
          break;
      }
    }

    if (!JSX) {
      WorkspaceContext.setUrlQuery('path', APP_DEFAULT_ACTIVE_MENUID);
    }

    return JSX || <div>当前页面不存在，跳转回“我的项目”</div>;
  });
}

/** 内容区 */
export function Content ({title, children}) {
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
export function Block ({style = {}, children}): JSX.Element {
  return (
    <div style={{marginBottom: 11, ...style}}>
      {children}
    </div>
  );
}
