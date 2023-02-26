import React from 'react'

import axios from 'axios'
import { observe } from '@mybricks/rxui'

import {Item} from '..'
import AppCtx from '../../AppCtx'
import NavMenu from './menu/navMenu'
import {UserGroup} from '../../components'
import {storage, isObject, getApiUrl} from '../../../utils'
import {MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND} from '../../../const'

export default function PlatformMenu() {
  return (
    <>
      <My />
      <Group />
      <div style={{marginTop: 'auto'}}>
        <Item
          icon="https://assets.mybricks.world/icon/163921.png"
          title="回收站"
          namespace="?appId=trash"
        />
      </div>
    </>
  )
}

function My() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const local: object = storage.get(MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND)
  const relLocal: object = local || {
    open: true,
    child: {}
  }
  const proxyLocal = setLocalProxy(relLocal, relLocal, MYBRICKS_WORKSPACE_DEFAULT_NAV_MY_EXPAND)

  return (
    <NavMenu
      id={'my'}
      name='我的'
      child={proxyLocal}
      namespace={`?appId=files`}
      icon='https://assets.mybricks.world/icon/myprojects.7cd8f4c7813982aa.png'
      getFiles={(id) => {
        return new Promise((resolve) => {
          const [, parentId] = id.split('-')

          axios({
            method: 'get',
            url: getApiUrl('/api/file/getMyFiles'),
            params: {
              userId: appCtx.user.email,
              extNames: 'folder,folder-project,folder-module',
              parentId
            }
          }).then(({data}) => {
            resolve(data.data)
          })
        })
      }}
      onClick={(id) => {
        const [, parentId] = id.split('-');
        history.pushState(null, '', `?appId=files${parentId ? `&parentId=${parentId}` : ''}`)
      }}
    />
  )
}

function Group() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const local: object = storage.get(MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND)
  const relLocal: object = local || {
    open: true,
    child: {}
  }
  const proxyLocal = setLocalProxy(relLocal, relLocal, MYBRICKS_WORKSPACE_DEFAULT_NAV_GROUP_EXPAND)

  return (
    <NavMenu
      id={''}
      name='协作组'
      child={proxyLocal}
      focusable={false}
      icon={UserGroup}
      getFiles={(id) => {
        return new Promise((resolve) => {
          const [groupId, parentId] = id.split('-')

          if (groupId) {
            // 查文件夹
            axios({
              method: 'get',
              url: getApiUrl('/api/file/getGroupFiles'),
              params: {
                userId: appCtx.user.email,
                extNames: 'folder,folder-project,folder-module',
                parentId,
                groupId
              }
            }).then(({data}) => {
              resolve(data.data)
            })
          } else {
            // 查协作组
            axios({
              method: 'get',
              url: getApiUrl('/paas/api/userGroup/getVisibleGroups'),
              params: {
                userId: appCtx.user.email
              }
            }).then(({data: {data}}) => {
              resolve(data)
            })
          }

          // axios({
          //   method: 'get',
          //   url: getApiUrl('/api/file/getMyFiles'),
          //   params: {
          //     userId: appCtx.user.email,
          //     extNames: 'folder,folder-project,folder-module',
          //     parentId
          //   }
          // }).then(({data}) => {
          //   resolve(data.data)
          // })
        })
      }}
      onClick={(id) => {
        const [groupId, parentId] = id.split('-');
        console.log('协作组 onClick: ', {groupId, parentId})
        history.pushState(null, '', `?appId=files${groupId ? `&groupId=${groupId}` : ''}${parentId ? `&parentId=${parentId}` : ''}`)
      }}
    />
  )
}

/**
 * nav开关信息写入localStorage
 * @param obj 
 * @param parentObj 
 * @param localKey 
 * @returns 
 */
export function setLocalProxy (obj, parentObj, localKey) {
  return new Proxy(obj, {
    set(target, key, value) {
      const preValue = target[key]

      target[key] = value

      if (key === 'open' || key === 'child') {
        if (preValue !== value) {
          if (value === false) {
            Reflect.set(target, 'child', {})
          }
          storage.set(localKey, parentObj)
        }
      }

      return true
    },
    get(target, key) {
      let value = target[key]

      if (isObject(value)) {
        value = setLocalProxy(value, parentObj, localKey)
      }

      return value
    }
  })
}