import React from 'react';
import { useComputed } from 'rxui-t';

import MyProjects from './myProjects';
import RunningTaskPanel from './tasks';
import WorkspaceContext, { APP_MENU_ITEM_MAP } from '../WorkspaceContext';

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
    let JSX: JSX.Element = <></>;

    const { user, urlQuery: { path } } = WorkspaceContext;

    switch (path) {
      case 'my_project':
        JSX = (
          <MyProjects user={user} />
        );
        break;
      case 'running_task':
        JSX = (
          <>
            <div className={css.title}>{APP_MENU_ITEM_MAP[path].title}</div>
            <RunningTaskPanel user={user} />
          </>
        );
        break;
      default:
        break;
    }

    return JSX;
  });
}
