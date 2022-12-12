import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useContext,
} from 'react'
import { createPortal } from 'react-dom'

import { Button } from 'antd'
import { envTypeMap } from './publish'
import { copyToClipboard } from './utils'
import { ExtNames } from './constant'

import { VersionContext } from './context'

import css from './modal.less'

const publishContentDefaultAry = [
  { key: 'creatorId', title: '发布人' },
  { key: 'version', title: '版本' },
  { key: 'type', title: '环境' },
  { key: 'createTime', title: '发布时间' },
  {
    key: 'commitInfo',
    title: '发布内容',
    value: (info) => {
      return info?.commitInfo || '无'
    },
  },
  // {
  //   key: 'version',
  //   infoKey: 'fileContentInfo',
  //   title: '对应保存版本',
  //   value: (info) => {
  //     return info?.version || '无'
  //   },
  // },
]

const publishContentCdmAry = [
  { key: 'creatorId', title: '发布人' },
  { key: 'version', title: '版本' },
  // {
  //   key: 'contentType',
  //   title: '类型',
  //   value: (info) => {
  //     return cdmTypeMap[info.contentType]
  //   },
  // },
  { key: 'createTime', title: '发布时间' },
  {
    key: 'commitInfo',
    title: '发布内容',
    value: (info) => {
      return info?.commitInfo || '无'
    },
  },
  // {
  //   key: 'version',
  //   infoKey: 'fileContentInfo',
  //   title: '对应保存版本',
  //   value: (info) => {
  //     return info?.version || '无'
  //   },
  // },
  // {
  //   key: 'url',
  //   title: 'URL',
  //   visible: (info) => {
  //     return info.contentType !== 'component'
  //   },
  // },
  // {
  //   key: 'comId',
  //   title: '组件ID',
  //   visible: (info) => {
  //     return info.contentType !== 'component'
  //   },
  //   value: (info) => {
  //     return `${info.fileId}@${info.version}`
  //   },
  // },
]

const saveContentAry = [
  { key: 'creatorId', title: '保存人' },
  { key: 'version', title: '版本' },
  { key: 'createTime', title: '保存时间' },
]

const saveContentDefaultAry = [
  ...saveContentAry,
  // {
  //   key: 'version',
  //   infoKey: 'filePubInfo',
  //   title: '对应发布版本(环境)',
  //   value: (info) => {
  //     return info ? `${info.version}(${envTypeMap[info.type]})` : '无'
  //   },
  // },
]

const saveContentCdmAry = [
  ...saveContentAry,
  // {
  //   key: 'version',
  //   infoKey: 'filePubInfo',
  //   title: '对应发布版本(类型)',
  //   value: (info) => {
  //     return info ? `${info.version}(${cdmTypeMap[info.contentType]})` : '无'
  //   },
  // },
]

const titleMap = {
  publish: '发布信息',
  save: '保存信息',
}

export default function PreviewModal({ info, visible, type, onCancel }) {
  const { file, viewNode, disabled } = useContext(VersionContext)

  const rollBack = useCallback(() => {
    // ctx.rollBackPublish(info);
  }, [info])

  const validOpenUrl = useMemo(() => {
    let url
    try {
      url = JSON.parse(info.content)?.url
    } catch (error) {

    }
    return url
  }, [info])

  const getSaveContentAry = useCallback(() => {
    const { extName } = file

    if (extName === ExtNames.CDM) {
      return saveContentCdmAry
    }
    return saveContentDefaultAry
  }, [file])

  const getPublishContentAry = useCallback(() => {
    const { extName } = file

    if (extName === ExtNames.CDM) {
      return publishContentCdmAry
    }

    return publishContentDefaultAry
  }, [file])

  let contentAry = getPublishContentAry()

  const isPublish = type === 'publish'

  if (!isPublish) {
    contentAry = getSaveContentAry()
  }

  let style: any = {}

  if (viewNode?.current) {
    style = viewNode?.current?.getBoundingClientRect?.()
  }

  const { extName } = file
  // const isCdm = extName === ExtNames.CDM

  return createPortal(
    <div
      className={css.modalContainer}
      style={{
        display: visible ? 'block' : 'none',
        left: style.left + style.width - 5 || 0,
      }}
    >
      <div className={css.title}>
        <div>{titleMap[type]}</div>
        <div className="fangzhou-theme">
          <div>
            {isPublish && validOpenUrl && (
              <Button size="small" onClick={() => window.open(validOpenUrl)}>
                打开
              </Button>
            )}
            <Button size="small" onClick={() => onCancel()}>
              关闭
            </Button>
            {/* <Button
              size="small"
              disabled={
                disabled ||
                info.idx === 0 ||
                info.contentType === 'component' ||
                (isCdm && isPublish)
              }
              type="primary"
              onClick={() => {
                if (type === 'publish') {
                  rollBack()
                } else {
                  const { filePubInfo, ...resInfo } = info
                  // ctx.rollBackSave(resInfo);
                }
              }}
            >
              回滚
            </Button> */}
          </div>
        </div>
      </div>

      <div className={css.contentWrap}>
        {contentAry.map((content, idx) => {
          // @ts-ignore
          const { key, title, infoKey, visible, value: customValue } = content

          if (typeof visible === 'function' && !visible(info)) return

          let value = info[key]

          if (typeof customValue === 'function') {
            if (infoKey) {
              value = customValue(info[infoKey])
            } else {
              value = customValue(info)
            }
          }

          if (key === 'type') {
            value = envTypeMap[value]
          }

          return (
            <div key={idx} className={css.listItem}>
              <div
                className={css.itemHeader}
                style={{ flex: isPublish ? '0 0 98px' : '0 0 138px' }}
              >
                {title}
              </div>
              <div className={css.itemContent}>{value}</div>
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
