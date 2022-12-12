import React, { useCallback } from 'react';
import { Breadcrumb } from 'antd';
import { useComputed } from 'rxui-t';

import { ChildPanelProps } from '..';

import css from './index.less';

/** 路径 */
export function Title ({user, ctx}: ChildPanelProps): JSX.Element {

  /** 路径点击 */
  const titleClick = useCallback((item, idx) => {
    ctx.path = ctx.path.slice(0, idx + 1);
    ctx.getAll(true);
  }, []);

  /** 渲染路径 */
  const Render: JSX.Element = useComputed(() => {
    const pathLastIndex = ctx.path.length - 1;
    return (
      // @ts-ignore ???
      <Breadcrumb separator='>' className={css.breadcrumb}>
        {ctx.path.map((item, idx) => {
          const { id, name } = item;
          return (
            // @ts-ignore ???
            <Breadcrumb.Item
              key={id}
              // @ts-ignore ???
              style={{cursor: pathLastIndex !== idx ? 'pointer' : 'default'}}
              onClick={() => {
                if (pathLastIndex !== idx) {
                  titleClick(item, idx);
                }
              }}
            >{name}</Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    );
  });

  return (
    <div className={css.title}>
      {Render}
    </div>
  );
}
