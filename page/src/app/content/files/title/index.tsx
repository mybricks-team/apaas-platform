import React, {useCallback, useEffect} from 'react';
import {Breadcrumb} from 'antd';

import css from './index.less';
import {Create} from "./Create";
import {evt, observe} from "@mybricks/rxui";
import Ctx from "../Ctx";

export default function TitleBar(): JSX.Element {
  const ctx = observe(Ctx, {from: "parents"})

  const titleClick = useCallback((item, idx) => {
    // ctx.path = ctx.path.slice(0, idx + 1);
    // ctx.getAll(true);

    const {groupId, id, extName} = item
    const isGroup = !!!extName && !!id

    let url = '?appId=files'

    if (isGroup) {
      url = url + `&groupId=${id}`
    } else {
      url = url + `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`
    }

    history.pushState(null, '', url)
  }, []);

  useEffect(() => {
    function click() {
      ctx.hideCreatePanel()
    }

    document.addEventListener('click', click)
    return () => {
      document.removeEventListener('click', click)
    }
  }, [])

  const pathLastIndex = ctx.path.length - 1;
  return (
    <div className={css.titleBar}>
      <Breadcrumb separator='>' className={css.breadcrumb}>
        {ctx.path.map((item, idx) => {
          const {id, name} = item;
          return (
            <Breadcrumb.Item
              key={id}
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

      <div className={css.btns}>
        <button onClick={evt(ctx.showCreatePanel).stop}><span>+</span>新建</button>
        <Create/>
      </div>
    </div>
  )
}
