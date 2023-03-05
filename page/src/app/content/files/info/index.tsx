import React from 'react'

import Group from './group'
import {Block} from '../../'
import FolderModule from './folderModule'
import FolderProject from './folderProject'

import css from './index.less'

export default function Info({path}) {
  const {id, extName} = path

  let JSX = null

  switch (true) {
    case !!!extName && !!id:
      JSX = Group
      break
    case extName === 'folder-module':
      JSX = FolderModule
      break
    case extName === 'folder-project':
      JSX = FolderProject
      break
    default:
      break
  }

  return JSX && (
    <Block
      style={{
        minWidth: 280,
        maxWidth: 280,
        marginBottom: 0,
        overflow: 'scroll'
      }}
      className={css.InfoContainer}
    >
      <JSX key={id} {...path}/>
    </Block>
  )
}

export function Title({content}) {
  return <div className={css.title}>{content || '加载中...'}</div>
}

export function Card({children}) {
  return (
    <div className={css.card}>{children}</div>
  )
}
