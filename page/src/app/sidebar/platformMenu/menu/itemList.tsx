import React, {useCallback} from 'react'

import {observe, useComputed} from '@mybricks/rxui'

import AppCtx from '../../../AppCtx'
import {FolderModule, FolderProject, UserGroup} from '../../../components'
import NavMenu, {Child, MenuCtx} from './navMenu'

interface Props {
  id: string;
  child: Child;
  menuCtx: MenuCtx;
  canDrag?: () => boolean;
}

/**
 * 
 * @param {Object} param0 
 * @param {Object} param0.id      id
 * @param {Object} param0.child   子节点
 * @param {Object} param0.menuCtx 上下文
 * @returns 
 */
export default function ItemList ({id, child, menuCtx, canDrag}: Props): JSX.Element {
  const appCtx = observe(AppCtx, {from: 'parents'})
  /**
   * 获取groupId 
   */
  const getParentId: () => string = useCallback(() => {
    const [parentId] = (id || '').split('-');

    return parentId;
  }, [])

  /**
   * 遍历子节点
   */
  const List: JSX.Element[] = useComputed(() => {
    // const parentId: string = getParentId();
    const {APPSMap} = appCtx
    const curAppsMap = { ...APPSMap };
    [
      {
        title: '项目文件夹',
        description: '通过项目的方式管理文件',
        type: 'user',
        extName: 'folder-project',
        namespace: 'mybricks-folder-project',
        icon: FolderProject
      },
      {
        title: '模块文件夹',
        description: '通过模块的方式管理文件',
        type: 'user',
        extName: 'folder-module',
        namespace: 'mybricks-folder-module',
        icon: FolderModule
      },
    ].forEach(app => {
      curAppsMap[app.namespace] = app;
      curAppsMap[app.extName] = app;
    })

    return menuCtx.items.map(item => {
      const { id, name, extName, parentId, groupId } = item;
      const isGroup = !!!extName && !!id
      // TODO,目前只有文件夹和协作组
      // const icon = item.extName ? 'https://assets.mybricks.world/icon/folder.5782d987cf098ea8.png' : 'https://assets.mybricks.world/icon/144257.png'
      const app = !isGroup ? curAppsMap[item.extName] : {icon: item?.icon || UserGroup}

      if (!child[id]) {
        child[id] = {open: false, child: {}}
      }
      // child[id] = {open: false, child: {}};
      
      return (
        <NavMenu
          key={id}
          id={isGroup ? String(id) : `${groupId}-${id}`}
          namespace={`?appId=files${isGroup ? `&groupId=${id}` : `${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`}`}
          name={name}
          child={child[id]}
          icon={app?.icon}
          getFiles={menuCtx.getFiles}
          onClick={menuCtx.onClick}
          canDrag={canDrag}
          info={item}
        />
      );
    });
  });


  return (
    <>
      {List}
    </>
  );
}
