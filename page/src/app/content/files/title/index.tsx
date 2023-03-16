import React, {useCallback, useEffect} from 'react';
import {Breadcrumb} from 'antd';
import {Create} from "./Create";
import {evt, observe} from "@mybricks/rxui";
import Ctx from "../Ctx";
import {FolderModule, FolderProject} from "../../../../app/components";

import css from './index.less';

export default function TitleBar(): JSX.Element {
  const ctx = observe(Ctx, {from: "parents"})

  const titleClick = useCallback((item) => {
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
					let icon = null;
					if (item.extName === 'folder-project') {
						icon = <FolderProject width={20} height={20} />;
					} else if (item.extName === 'folder-module') {
						icon = <FolderModule width={20} height={20} />;
					}
          return (
            <Breadcrumb.Item
              key={id}
              // @ts-ignore
              style={{cursor: pathLastIndex !== idx ? 'pointer' : 'default'}}
              onClick={() => {
                if (pathLastIndex !== idx) {
                  titleClick(item);
                }
              }}
            >
	            <div className={css.breadcrumbContent}>
		            {icon}
		            <span>{name}</span>
	            </div>
            </Breadcrumb.Item>
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
