import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Spin, message } from 'antd'

import SaveList from './save'
import PublishList from './publish'
import PreviewModal from './modal'

import { _axios, Uniqe } from './utils'
import { VersionPanelType } from './constant'

import { VersionContext } from './context'

import css from './version.less'

interface VersionInitApi {
  getLatest: () => void
  switchAciveTab: (activeKey: VersionPanelType) => void
}

interface VersionConfig {
  file: any
  disabled?: boolean
  saveConfig?: any
  publishConfig?: any
  onInit?: (api: VersionInitApi) => void
}

const TABS = [
  { id: VersionPanelType.PUBLISH, name: '发布' },
  { id: VersionPanelType.SAVE, name: '保存' },
]

interface ListState {
  loading: boolean
  pageIndex: number
  dataSource: Array<any>
}

interface GetListParams {}

const useVersionList = ({ fetchUrl }) => {
  const uniqueRef = useRef(new Uniqe('id'))
  const [listState, setListState] = useState<ListState>({
    loading: false,
    pageIndex: 1,
    dataSource: [],
  })

  /** 获取分页数据 */
  const getList = useCallback(
    async ({
      fileId,
      pageSize = 10,
      pageIndex = 1,
    }: {
      fileId: number
      pageSize?: number
      pageIndex?: number
    }) => {
      const { data }: any = await _axios.get(
        `${fetchUrl}?fileId=${fileId}&pageSize=${pageSize}&pageIndex=${pageIndex}`
      )

      if (!Array.isArray(data)) {
        return
      }

      setListState((c) => {
        const comboData = uniqueRef.current.filterData(data)
        const newDataSource = c.dataSource.concat(comboData ?? [])
        newDataSource.sort((a, b) => b.createTime - a.createTime)
        return {
          ...c,
          dataSource: newDataSource,
        }
      })
    },
    []
  )

  /** 获取最新数据插入到头部，经常在切换tab以及被别人唤起时使用，所以pageIndex为1，目前size不太合理先用着 */
  const getLatestList = useCallback((fileId) => {
    getList({
      fileId,
      pageIndex: 1,
      pageSize: 20,
    })
  }, [getList])

  const setLoading = useCallback((bool: boolean) => {
    setListState((c) => ({ ...c, loading: bool }))
  }, [])

  return { listState, getList, getLatestList, setLoading }
}

const Tabs = ({ onChange }) => {
  const [activeKey, setActiveKey] = useState(VersionPanelType.PUBLISH)

  useEffect(() => {
    typeof onChange === 'function' && onChange(activeKey)
  }, [activeKey])

  return (
    <>
      <div className={css.title}>
        {TABS.map((tab) => {
          const { id, name } = tab
          return (
            <div
              key={id}
              className={`${css.tt} ${activeKey === id ? css.active : ''}`}
              onClick={() => {
                setActiveKey(id)
              }}
            >
              {name}
            </div>
          )
        })}
        <div
          style={{
            flex: '1 1 0%',
            borderBottom: '1px solid #CCC',
            height: '100%',
          }}
        ></div>
      </div>
    </>
  )
}

const defaultPubInfoRender = ({ version }) => version

export default ({
  file,
  disabled,
  saveConfig = {
    pageSize: 100,
    renderPubInfo: defaultPubInfoRender,
  },
  publishConfig = {
    pageSize: 100,
    renderPubInfo: defaultPubInfoRender,
  },
  onInit,
}: VersionConfig) => {
  const [state, setState] = useState({
    loading: false,
    tabActive: '',
  })

  const [modalConfig, setModalConfig] = useState({
    visible: false,
    info: {},
    type: '',
  })

  const {
    listState: saveListState,
    getList: getSaveList,
    getLatestList: getSaveLatestList,
    setLoading: setSaveLoading,
  } = useVersionList({ fetchUrl: '/api/workspace/save/versions' })
  const {
    listState: publishListState,
    getList: getPublishList,
    getLatestList: getPublishLatestList,
    setLoading: setPublishLoading,
  } = useVersionList({ fetchUrl: '/api/workspace/publish/versions' })

  const viewNode = useRef(null)

  // const getSaveList = useCallback(
  //   async ({ fileId, pageSize = 10, pageIndex = 0 }) => {
  //     const { data }: any = await _axios.get(
  //       `/api/workspace/save/versions?fileId=${fileId}&pageSize=${pageSize}&pageIndex=${pageIndex}`
  //     )

  //     if (!Array.isArray(data)) {
  //       return
  //     }

  //     setSaveListState((c) => {
  //       const comboData = saveUnique.current.filterData(data)
  //       const newDataSource = c.dataSource.concat(comboData ?? [])
  //       newDataSource.sort((a, b) => b.createTime - a.createTime)
  //       return {
  //         ...c,
  //         dataSource: newDataSource,
  //       }
  //     })
  //   },
  //   []
  // )

  // const getPublishList = useCallback(
  //   async ({ fileId, pageSize = 10, pageIndex = 0 }) => {
  //     const { data }: any = await _axios.get(
  //       `/api/workspace/publish/versions?fileId=${fileId}&pageSize=${pageSize}&pageIndex=${pageIndex}`
  //     )

  //     if (!Array.isArray(data)) {
  //       return
  //     }

  //     setPublishListState((c) => {
  //       const comboData = publishUnique.current.filterData(data)
  //       const newDataSource = c.dataSource.concat(comboData ?? [])
  //       newDataSource.sort((a, b) => b.createTime - a.createTime)
  //       return {
  //         ...c,
  //         dataSource: newDataSource,
  //       }
  //     })
  //   },
  //   []
  // )

  useEffect(() => {
    setSaveLoading(true)
    getSaveList({
      fileId: file?.id,
      pageIndex: saveListState.pageIndex,
      pageSize: saveConfig.pageSize,
    }).finally(() => {
      setSaveLoading(false)
    })
  }, [file?.id, saveListState.pageIndex, saveConfig.pageSize])

  useEffect(() => {
    setPublishLoading(true)
    getPublishList({
      fileId: file?.id,
      pageIndex: publishListState.pageIndex,
      pageSize: publishConfig.pageSize,
    }).finally(() => {
      setPublishLoading(false)
    })
  }, [file?.id, publishListState.pageIndex, publishConfig.pageSize])

  const openModal = useCallback((type, selectedItem, index) => {
    setModalConfig({
      visible: true,
      info: { ...(selectedItem || {}), idx: index },
      type,
    })
  }, [])

  const openPublishModal = useCallback(
    (selectedItem, index) => {
      openModal(VersionPanelType.PUBLISH, selectedItem, index)
    },
    [openModal]
  )

  const openSaveModal = useCallback(
    (selectedItem, index) => {
      openModal(VersionPanelType.SAVE, selectedItem, index)
    },
    [openModal]
  )

  const rollbackSave = useCallback(async (id) => {
    await _axios.post('api/workspace/file/revert', {
      fileContentId: id,
    })
  }, [])

  const rollbackPublish = useCallback(async (id) => {
    await _axios.post('api/workspace/file/revert', {
      filePubId: id,
    })
  }, [])

  useEffect(() => {
    typeof onInit === 'function' &&
      onInit({
        getLatest: () => {
          getSaveLatestList(file?.id)
          getPublishLatestList(file?.id)
        },
        switchAciveTab: (activeKey) => {
          setState((c) => ({ ...c, tabActive: activeKey }))
        },
      })
  }, [onInit])

  return (
    <VersionContext.Provider
      value={{
        openPublishModal,
        openSaveModal,
        file,
        viewNode,
        disabled,
      }}
    >
      <div className={css.view} ref={viewNode}>
        <Tabs
          onChange={(activeKey) => {
            setState((c) => ({ ...c, tabActive: activeKey }))
            setModalConfig((c) => ({ ...c, visible: false }))
            if (activeKey === VersionPanelType.SAVE) {
              getSaveLatestList(file?.id)
            }
            if (activeKey === VersionPanelType.PUBLISH) {
              getPublishLatestList(file?.id)
            }
          }}
        />
        <div
          className={css.content}
        >
          <div className={css.list}>
            <div
              style={{
                display:
                  state.tabActive === VersionPanelType.SAVE ? 'block' : 'none',
              }}
            >
              <Spin
                spinning={saveListState.loading}
                wrapperClassName="fangzhou-theme"
                tip="加载中"
              >
                <SaveList
                  dataSource={saveListState.dataSource}
                  onScrollBottom={() => {}}
                />
              </Spin>
            </div>
            <div
              className={css.publishContainer}
              style={{
                display:
                  state.tabActive === VersionPanelType.PUBLISH
                    ? 'block'
                    : 'none',
              }}
            >
              <Spin
                spinning={publishListState.loading}
                wrapperClassName="fangzhou-theme"
                tip="加载中"
              >
                <PublishList
                  dataSource={publishListState.dataSource}
                  onScrollBottom={() => {}}
                />
              </Spin>
            </div>
            <PreviewModal
              visible={modalConfig.visible}
              onCancel={() => {
                setModalConfig((c) => ({ ...c, visible: false }))
              }}
              info={modalConfig.info}
              type={modalConfig.type}
            />
          </div>
        </div>
      </div>
    </VersionContext.Provider>
  )
}
