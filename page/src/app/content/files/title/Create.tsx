import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import axios from 'axios'
import { observe } from '@mybricks/rxui'
import { message, Modal, Form, Input, Radio, Select } from 'antd'

import { Icon } from '../../../components'
import Ctx, { folderExtnames } from '../Ctx'
import { useDebounceFn } from '../../../hooks'
import AppCtx, { T_App } from '../../../AppCtx'
import { getApiUrl, getUrlQuery } from '../../../../utils'

import css from './Create.less'
import TemplateChooseModal from './templateChooseModal'
import PageChooseModal from './PageChooseModal'

let chooseApp = null
let chooseTemplate = null
/** 创建项目 */
export function Create(): JSX.Element {
  const ctx = observe(Ctx, { from: 'parents' })
  const appCtx = observe(AppCtx, { from: 'parents' })
  const [createApp, setCreateApp] = useState(null)
  const [chooseTemplateModalVisible, setChooseTemplateModalVisible] = useState(false)
  const [pageChooseModalVisible, setPageChooseModalVisible] = useState(false)
  const [targetPageId, setTargetPageId] = useState(0) // pc模板要操作的目标页面

  /** 点击新建 */
  const newProject: (app: any) => void = useCallback(async (app: T_App) => {
    console.log(`创建app:`, app)
    const currentUserSystemConfig = appCtx.getCurrentUserSystemConfig();
    // @ts-ignore
    if (currentUserSystemConfig?.createFileCount) {
      // @ts-ignore
      const appMaxCreateFleCount = currentUserSystemConfig?.createFileCount?.[app.extName];
      if (appMaxCreateFleCount) {
        const rtn = (await axios({
          method: 'post',
          url: getApiUrl('/paas/api/file/getCountOfUserAndExt'),
          data: { userId: appCtx.user.id, extName: app.extName }
        })).data;
        if (rtn.code === 1) {
          if (appMaxCreateFleCount <= rtn.data) {
            message.error('当前账号此类型文件数量已达上限，禁止新建')
            return
          }
        }
      }
    }
    // 开启了基于模板新建
    if (appCtx?.systemConfig?.createBasedOnTemplate && appCtx?.systemConfig?.createBasedOnTemplate?.indexOf(app.namespace) !== -1) {
      // 基于模板新建
      setChooseTemplateModalVisible(true)
      chooseApp = app
    } else if (app.namespace === 'mybricks-app-pc-template') {
      setPageChooseModalVisible(true)
      chooseApp = app
    } else {
      // 直接新建
      setCreateApp(app)
    }

  }, []);

  const FolderList: JSX.Element = useMemo(() => {
    return designAPPSFilter(appCtx.FolderAPPS, ctx.path).map(app => {
      const {
        icon,
        title,
        description
      } = app;
      return (
        <div
          key={app.type}
          className={css.project}
          data-namespace={app.namespace}
          data-version={app.version}
          onClick={() => newProject(app)}
        >
          <div className={css.typeIcon}>
            <div style={{ width: 32, height: 32 }}>
              <Icon icon={icon} />
            </div>
          </div>
          <div className={css.tt}>
            <label>{title}</label>
            <p>{description}</p>
          </div>
          <div className={css.snap}>

          </div>
        </div>
      );
    })
  }, [ctx.path])

  /** 搭建应用列表 */
  const AppList: JSX.Element[] = useMemo(() => {
    return appCtx.DesignAPPS.map(app => {
      const {
        icon,
        title,
        description
      } = app;
      return (
        <div
          key={app.type}
          className={css.project}
          data-namespace={app.namespace}
          data-version={app.version}
          onClick={() => newProject(app)}
        >
          <div className={css.typeIcon}>
            <div style={{ width: 32, height: 32 }}>
              <Icon icon={icon} />
            </div>
          </div>
          <div className={css.tt}>
            <label>{title}</label>
            <p>{description}</p>
          </div>
          <div className={css.snap}>

          </div>
        </div>
      );
    })
  }, []);

  const modalOk = useCallback((values, app) => {
    return new Promise(async (resolve, reject) => {
      const item = ctx.path[ctx.path.length - 1];
      const isGroup = !!!item.extName && !!item.id
      const { fileName, componentType } = values
      const { extName, isSystem } = app
      const params: any = {
        extName,
        userId: appCtx.user.id,
        userName: appCtx.user.name || appCtx.user.email,
      }

      if (isGroup) {
        params.groupId = item.id
      } else {
        params.parentId = item.id
        params.groupId = item.groupId
      }

      // const check = await axios({
      //   method: 'get',
      //   url: getApiUrl('/paas/api/file/checkFileCanCreate'),
      //   params: {
      //     ...params,
      //     fileName,
      //     isCreate: true
      //   }
      // })
      // 暂时放开同名文件检测
      const check = { data: { data: { next: true } } }

      if (check.data?.data?.next) {
        if (isSystem) {
          params.type = 'system'
        }

        if (chooseTemplate) {
          axios({
            method: 'post',
            url: getApiUrl('/paas/api/file/createFileBaseTemplate'),
            data: { ...params, name: fileName, templateId: chooseTemplate.fileId, dumpJSON: chooseTemplate.dumpJSON }
          }).then(async ({ data }) => {
            if (data.code === 1) {
              const appReg = appCtx.APPSMap[extName]
              const { homepage } = appReg

              ctx.getAll(getUrlQuery())

              if (typeof homepage === 'string') {
                setTimeout(() => {
                  window.open(`${homepage}?id=${data.data.id}`);
                }, 0);
              }

              if (folderExtnames.includes(extName)) {
                await appCtx.refreshSidebar()
              }

              resolve('创建成功！')
            } else {
              reject(`创建文件错误：${data.message}`)
            }
          })
        } else {
          axios({
            method: 'post',
            url: getApiUrl('/paas/api/workspace/createFile'),
            data: { ...params, name: fileName, componentType }
          }).then(async ({ data }) => {
            if (data.code === 1) {
              const appReg = appCtx.APPSMap[extName]
              const { homepage } = appReg

              ctx.getAll(getUrlQuery())
              if (typeof homepage === 'string') {
                const { id: fileId } = data.data
                if (app.extName === 'pc-template') {
                  setTimeout(() => {
                    window.open(`${homepage}?id=${fileId}&targetPageId=${targetPageId}`);
                  }, 0);
                } else {
                  setTimeout(() => {
                    window.open(`${homepage}?id=${data.data.id}`);
                  }, 0);
                }
              }

              if (folderExtnames.includes(extName)) {
                await appCtx.refreshSidebar()
              }

              resolve('新建成功')
            } else {
              reject(`创建文件错误：${data.message}`)
            }
          })
        }
      } else {
        reject(check.data?.data?.message || '相同路径下不允许创建同名文件！')
      }
    })
  }, [targetPageId])

  const modalCancel = useCallback(() => {
    setCreateApp(null)
  }, [])

  const RenderCreateAppModal = useMemo(() => {
    return (
      <CreateFileModal
        app={createApp}
        onOk={modalOk}
        onCancel={modalCancel}
      />
    )
  }, [createApp])

  const renderTemplateChooseModal = () => {
    if (chooseTemplateModalVisible) {
      return (
        <TemplateChooseModal
          modalVisible={chooseTemplateModalVisible}
          extName={chooseApp?.extName}
          onChoose={(param) => {
            chooseTemplate = param
            setChooseTemplateModalVisible(false)
            setCreateApp(chooseApp)
          }}
          onCancel={() => {
            setChooseTemplateModalVisible(false)
          }}
          onOk={() => {
            setChooseTemplateModalVisible(false)
            setCreateApp(chooseApp)
          }}
        />
      );
    } else {
      return null
    }
  }
  const renderPageChooseModal = () => {
    if (pageChooseModalVisible) {
      return (
        <PageChooseModal
          modalVisible={pageChooseModalVisible}
          extName={`pc-page`}
          onChoose={(param) => {
            const { fileId } = param
            setTargetPageId(fileId)
            setPageChooseModalVisible(false)
            setCreateApp(chooseApp)
          }}
          onCancel={() => {
            setPageChooseModalVisible(false)
          }}
          onOk={() => {
            setPageChooseModalVisible(false)
            setCreateApp(chooseApp)
          }}
        />
      );
    } else {
      return null
    }
  }

  return (
    <div className={css.createContainer} style={{ display: !ctx.popCreate ? 'none' : '' }}>
      {RenderCreateAppModal}
      {renderPageChooseModal()}
      {renderTemplateChooseModal()}
      <div className={css.news}>
        {FolderList}
      </div>
      <div className={css.divider} />
      <div className={css.news}>
        {AppList}
      </div>
    </div>
  )
}

function CreateFileModal({ app, onOk, onCancel }) {
  const [context] = useState({
    submittable: true
  })
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

  const { run: ok } = useDebounceFn(() => {
    form.validateFields().then((values) => {
      setBtnLoading(true)
      onOk(values, app).then((msg) => {
        message.success(msg)
        cancel()
      }).catch((e) => {
        setBtnLoading(false)
        message.warn(e)
      })
    })
  }, { wait: 200 });

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    form.resetFields()
    chooseTemplate = null
  }, [])

  useEffect(() => {
    if (app && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
        if (chooseTemplate?.title) {
          setTimeout(() => {
            form.setFieldValue('fileName', `${chooseTemplate.title}(来自分享)`)
          }, 100)
        }
      }, 100)
    }
  }, [app])

  return (
    <Modal
      open={!!app}
      title={`新建${app?.title}`}
      okText={btnLoading ? '校验中...' : '确认'}
      cancelText={'取消'}
      centered={true}
      onOk={ok}
      onCancel={cancel}
      confirmLoading={btnLoading}
      bodyStyle={{
        minHeight: 104
      }}
    >
      <Form
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        form={form}
        className={css.createForm}
      >
        <Form.Item
          label='名称'
          name="fileName"
          rules={[{
            required: true, message: `请输入${app?.title}名称`, validator(rule, value) {
              return new Promise((resolve, reject) => {
                if (!value.trim()) {
                  reject(rule.message)
                } else[
                  resolve(true)
                ]
              })
            }
          }]}
        >
          <Input
            onCompositionStart={() => {
              context.submittable = false
            }}
            onCompositionEnd={() => {
              context.submittable = true
            }}
            ref={ref}
            placeholder={`请输入${app?.title}名称`}
            autoFocus
            onPressEnter={() => context.submittable && ok()}
          />
        </Form.Item>
        {['cloud-com', 'theme'].includes(app?.extName) ? (
          <Form.Item label='类型' name="componentType" initialValue="PC">
            <Select
              options={[
                { value: 'PC', label: 'PC' },
                { value: 'H5', label: 'H5' }
              ]}
            />
          </Form.Item>
        ) : null}
        {/* {['cloud-com', 'mp-cloudcom'].includes(app?.extName) ? (
		      <Form.Item label='类型' name="type" initialValue="other">
			      <Radio.Group
              options={[
                { label: '菜单', value: 'menu' },
                { label: '登录', value: 'login' },
                { label: '内容', value: 'content'},
                { label: '其他', value: 'other' }
              ]}
            />
		      </Form.Item>
	      ) : null} */}

        {/*{['domain'].includes(app?.extName) ? (*/}
        {/*  <Form.Item label='类型' name="type" initialValue="normal">*/}
        {/*    <Radio.Group*/}
        {/*      options={[*/}
        {/*	      { label: '普通', value: 'normal' },*/}
        {/*	      { label: '协作', value: 'system' }*/}
        {/*      ]}*/}
        {/*    />*/}
        {/*  </Form.Item>*/}
        {/*) : null}*/}
      </Form>
    </Modal>
  )
}

function designAPPSFilter(apps, path) {
  let finalApps = apps
  const inFolderProjectAndModule = !!path.find((item) => ['folder-project', 'folder-module'].includes(item.extName))
  /**
   * 项目文件夹、模块文件夹下无法创建项目文件夹
   */
  if (inFolderProjectAndModule) {
    finalApps = apps.filter((app) => app.extName !== 'folder-project')
  }

  return finalApps
}
