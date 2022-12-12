import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Button, Select, message } from 'antd'
import { VersionContext } from './context'
import { UpdateTime, _axios } from './utils'
import { ExtNames } from './constant'

import css from './version.less'

export const envTypeMap = {
  prod: '线上环境',
  // prt: '预发环境',
  staging: '日常环境',
}

const filPubInfoCache = new Map()
const getPubInfo = async (filPubId) => {
  if (filPubInfoCache.has(filPubId)) {
    return filPubInfoCache.get(filPubId)
  }

  const { data }: any = await _axios.get(`/api/workspace/publish/content?id=${filPubId}`)

  if (!data) {
    throw new Error('invalid data')
  }

  filPubInfoCache.set(filPubId, data)

  return data
}

const PublishList = ({ dataSource, onScrollBottom }) => {
  const [state, setState] = useState({
    currentSelect: '',
  })

  const { file, openPublishModal } = useContext(VersionContext)

  const selectOptions = useMemo(() => {
    switch (true) {
      case file?.extName === ExtNames.PC: {
        return Object.keys(envTypeMap).map((key) => ({
          label: envTypeMap[key],
          value: key,
        }))
      }
      default: {
        return []
      }
    }
  }, [file?.extName])

  const hasSelectOptions = useMemo(() => {
    return Array.isArray(selectOptions) && selectOptions.length > 1
  }, [selectOptions])

  useEffect(() => {
    if (!state.currentSelect && selectOptions?.[0]?.value) {
      setState(c => ({ ...c, currentSelect: selectOptions[0].value }))
    }
  }, [state.currentSelect])

  const filterDataSource = useMemo(() => {
    return dataSource.filter((item) => {
      if (!hasSelectOptions) {
        return true
      }
      return item.type === state.currentSelect
    })
  }, [dataSource, file?.extName, state.currentSelect, hasSelectOptions])

  const openAsyncModal = useCallback(async (file, index) => {
    try {
      const data = await getPubInfo(file.id);
      openPublishModal({ ...file, content: data?.content }, index)
    } catch (error) {
      message.error(error?.msssage || '查询发布版本详情失败')
    }
  }, [])

  return (
    <div className={css.publishView}>
      <div className={`${css.publishTitle} fangzhou-theme`}>
        {
          hasSelectOptions && <div className={css.select}>
            <Select
              size="small"
              style={{ width: '100%', fontSize: 12 }}
              dropdownClassName="fangzhou-theme"
              onChange={(val) => {
                setState((c) => ({ ...c, currentSelect: val }))
              }}
              value={state.currentSelect}
            >
              {selectOptions.map(({ value, label }) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </div>
        }
      </div>
      {!Array.isArray(filterDataSource) || !filterDataSource.length ? (
        <div className={css.nodata}>暂无当前环境的发布记录</div>
      ) : (
        <div>
          {filterDataSource.map((file, idx) => {
            const name = file.creatorId?.split?.('@')?.[0]
            const title = `${name} 发布于 ${UpdateTime(file.updateTime)}`
            const { fileContentInfo } = file

            return (
              <div className={css.publishCardContainer}>
                <div
                  key={file.id}
                  className={css.card}
                  onClick={() => {
                    openAsyncModal(file, idx)
                  }}
                >
                  <div className={css.head}>
                    <div>{file.version}</div>
                  </div>
                  <div className={css.body}>
                    <div className={css.info}>
                      保存版本：{fileContentInfo?.version || '无'}
                    </div>
                    <div className={css.info}>{title}</div>
                    <div className={css.info}>
                      发布内容：{file.commitInfo || '无'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PublishList
