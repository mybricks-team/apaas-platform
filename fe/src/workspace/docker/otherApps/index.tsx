import React, { useCallback, useMemo } from 'react';
import { useComputed } from 'rxui-t';

import { Item, Catelog } from '../Docker';
import WorkspaceContext, { T_App } from '../../WorkspaceContext';

/** 安装的app */
export function OtherApps (): JSX.Element {
  const appClick: (app: T_App) => void = useCallback((app) => {
    const { homepage } = app;

    if (typeof homepage === 'string') {
	    WorkspaceContext.selectedApp = app;
    }
  }, []);

  const Apps: JSX.Element = useComputed(() => {
    const { DockerAPPS, selectedApp } = WorkspaceContext;
		
    return (
      <Catelog>
        {DockerAPPS.map((app) => {
          const { namespace } = app;
          return (
            <Item
              key={namespace}
              active={selectedApp?.namespace === namespace}
              item={app}
              onClick={() => appClick(app)}
            />
          );
        })}
      </Catelog>
    )
  });

  return Apps;
}
