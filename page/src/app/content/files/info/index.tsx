import React from 'react'

import Group from './group'
import {Block} from '../../'
import FolderModule from './folderModule'

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
    default:
      break
  }

  return JSX && (
    <Block style={{minWidth: 280}} className={css.InfoContainer}>
      <JSX key={Math.random()} {...path}/>
    </Block>
  )
}