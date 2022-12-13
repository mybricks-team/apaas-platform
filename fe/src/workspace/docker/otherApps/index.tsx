import React, { useMemo } from 'react';

import { Item, Catelog } from '../Docker';
import WorkspaceContext from '../../WorkspaceContext';

/** 安装的app */
export function OtherApps (): JSX.Element {
  /** 安装的app */
  const Apps: JSX.Element = useMemo(() => {
    const { DockerAPPS } = WorkspaceContext;
		
    return (
      <Catelog>
        {DockerAPPS.map((app) => {
          const { icon, title, namespace } = app;
          return (
            <Item
              key={namespace}
              icon={icon}
              title={title}
              namespace={namespace}
            />
          );
        })}
      </Catelog>
    )
  }, []);

  return Apps;
}
