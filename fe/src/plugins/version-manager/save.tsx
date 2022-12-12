import React, { useState, useContext } from 'react';
import { VersionContext } from './context'

import { UpdateTime } from './utils'

import css from './version.less'


const SaveList = ({ dataSource, onScrollBottom }) => {
  const { file, openSaveModal } = useContext(VersionContext)

  if (!Array.isArray(dataSource) || !dataSource.length) {
    return <div className={css.nodata}>暂无保存记录</div>
  }

  return (
    <div>
      {
        dataSource.map((file, idx) => {
          const name = file.creatorId?.split?.('@')?.[0]
          const title = `${name} 保存于 ${UpdateTime(file.updateTime)}`
          const { filePubInfo } = file

          let pubInfo = '无'

          // if (filePubInfo) {
          //   const { version, envType, contentType } = filePubInfo
          //   if (isCdm) {
          //     pubInfo = `${cdmTypeMap[contentType]}(${version})`
          //   } else {
          //     pubInfo = `${envTypeMap[envType]}(${version})`
          //   }
          // }
    
          return (
            <div className={css.cardContainer}>
              <div
                // className={`${css.card} ${modalCtx.visible && modalCtx.info.id === file.id ? css.active : ''}`}
                className={css.card}
                onClick={() => {
                  openSaveModal({ ...file }, idx)
                  // modalCtx.visible = true
                  // modalCtx.info = {
                  //   ...file, idx
                  // }
                  // modalCtx.type = 'save'
                }}
              >
                <div className={css.head}>
                  <div>{file.version}</div>
                </div>
                <div className={css.body}>
                  {/* { filePubInfo && <div className={css.info}>发布版本：{renderSavePubInfo(filePubInfo)}</div> } */}
                  <div className={css.info}>{title}</div>
                </div>
              </div>
            </div>
          )
        })
      }
    </div>
  )
}

export default SaveList