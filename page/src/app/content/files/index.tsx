import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react'

import axios from 'axios'
import {
  evt,
  observe,
  useComputed,
  useObservable
} from '@mybricks/rxui'
import {Form, message, Modal, Input} from 'antd'
import {EditOutlined, ExclamationCircleFilled} from '@ant-design/icons'

import Info from './info'
import TitleBar from './title'
import AppCtx from '../../AppCtx'
import {Content, Block} from '..'
import {Divider, Dropdown} from '../../components'
import Ctx, {folderExtnames} from './Ctx'
import {getApiUrl, getUrlQuery} from '../../../utils'
import {Icon, Trash, More} from '../../components'

import css from './index.less'

const {confirm} = Modal

export default function Files() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = useObservable(Ctx, next => {
    next({
      user: appCtx.user,
      setPath({parentId, groupId}) {
        ctx.projectList = null
        const path = !groupId ? [{id: null, name: '我的', parentId: null, groupId: null, extName: null}] : []

        axios({
          method: "get",
          url: getApiUrl('/api/file/getFilePath'),
          params: {userId: appCtx.user.email, fileId: parentId, groupId}
        }).then(({data: {data}}) => {
          if (data.length) {
            if (data[0]) {
              path.push(...data)
            } else {
              history.pushState(null, '', `?appId=files`)
              return
            }
          }
          ctx.path = path
        })
        ctx.getAll({parentId, groupId})
      },
      getAll({parentId, groupId}) {
        if (!groupId) {
          axios({
            method: 'get',
            url: getApiUrl('/api/file/getMyFiles'),
            params: {
              userId: appCtx.user.email,
              parentId
            }
          }).then(({data}) => {
            ctx.projectList = data.data
          })
        } else {
          axios({
            method: 'get',
            url: getApiUrl('/api/file/getGroupFiles'),
            params: {
              userId: appCtx.user.email,
              parentId,
              groupId
            }
          }).then(({data}) => {
            ctx.projectList = data.data
          })
        }
      }
    })
  }, {to: 'children'})
  // const latestPath = useComputed(() => {
	// 	return ctx.path[ctx.path.length - 1]
	// })

  useComputed(() => {
    const {urlQuery} = appCtx
    const {parentId, groupId} = urlQuery
    setTimeout(() => {
      ctx.setPath({parentId, groupId})
    })
  })

  const pathInfo = useComputed(() => {
    const pathInfo = ctx.path.at(-1)
    return pathInfo
  })

  return (
    <>
      <Content title={<TitleBar/>}>
        <Block style={{flex: 1, height: 0, marginBottom: 0, display: 'flex'}}>
	        <Block style={{ flex: 1, marginBottom: 0, overflowY: 'auto' }}>
		        <Projects/>
	        </Block>
	        {/* {latestPath?.extName === 'folder-module' ? (
		        <Block style={{width: '300px', marginBottom: 0}}>
			        <Box />
		        </Block>
	        ) : null} */}
          {/* <Block style={{minWidth: 280}}>
            <div>新的块儿</div>
          </Block> */}
          {pathInfo && <Info path={pathInfo}/>}
        </Block>
      </Content>
    </>
  );
}

function Projects() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = observe(Ctx, {from: "parents"})
  const [createApp, setCreateApp] = useState(null)

  /** 各种操作 */
  const operate = useCallback((type, item) => {
    const {id, name, extName, parentId, groupId, homepage} = item;
    switch (type) {
      case 'open':
        if (!folderExtnames.includes(extName)) {
          window.location.href = `${homepage}?id=${id}`;
        } else {
          history.pushState(null, '', `?appId=files${groupId ? `&groupId=${groupId}` : ''}${id ? `&parentId=${id}` : ''}`)
        }
        break;
      case 'delete':
        confirm({
          title: `确定要删除"${name}"吗？`,
          icon: <ExclamationCircleFilled />,
          centered: true,
          okText: '确认',
          cancelText: '取消',
          onOk() {
            return new Promise((resolve) => {
              axios({
                method: "post",
                url: getApiUrl('/api/workspace/deleteFile'),
                data: {id: item.id, userId: appCtx.user.email}
              }).then(async ({data}) => {
                if (data.code === 1) {
                  ctx.getAll(getUrlQuery());
                  if (folderExtnames.includes(extName)) {
                    await appCtx.refreshSidebar();
                  }
                  resolve(true);
                } else {
                  message.error(`删除项目错误：${data.message}`);
                }
              });
            })
          },
          onCancel() {},
        })
        break;
      case 'rename':
        setCreateApp(item)
        break;
      default:
        break;
    }
  }, []);

  /** 渲染项目列表 */
  const Render: JSX.Element | JSX.Element[] = useComputed(() => {
    let JSX: JSX.Element | JSX.Element[] = <></>;
    const userId = appCtx.user.email
    if (Array.isArray(ctx.projectList)) {
      if (ctx.projectList.length) {
        const {APPSMap} = appCtx;
        JSX = ctx.projectList.map((project) => {
          const {extName} = project
          const appReg = APPSMap[extName];

          if (!appReg) {
            return <></>;
          }

          const {icon, homepage} = appReg;
          const bigIcon = folderExtnames.includes(extName) || project.icon
          const showOperate = project.creatorId === userId

          return (
            <div key={project.id} className={css.file} onClick={() => operate('open', {...project, homepage})}>
              <div className={css.snap}>
                <Icon icon={project.icon || icon} width={bigIcon ? 140 : 32} height={bigIcon ? '100%' : 32}/>
              </div>
              <div className={css.tt}>
                <div className={css.typeIcon}>
                  <Icon icon={icon} width={18} height={18}/>
                </div>
                <div className={css.detail}>
                  <div className={css.name}>
                    {project.name}
                  </div>
                  <div className={css.path} data-content-start={project.path}>
                    {project.creatorName}
                  </div>
                </div>
                {/* TODO: 如果文件在底部，操作项被遮挡 */}
                {showOperate && <div className={css.btns} onClick={evt(() => {}).stop}>
                  <Dropdown
                    menus={[
                      {
                        key: '1',
                        label: (
                          <div className={css.operateItem} onClick={() => operate('rename', project)}>
                            <EditOutlined width={16} height={16}/>
                            <div className={css.label}>重命名</div>
                          </div>
                        )
                      },
                      {
                        key: '2',
                        label: (
                          <Divider />
                        )
                      },
                      {
                        key: '3',
                        label: (
                          <div className={css.operateItem} onClick={() => operate('delete', project)}>
                            <Trash width={16} height={16}/>
                            <div className={css.label}>删除</div>
                          </div>
                        )
                      }
                    ]}
                    overlayClassName={css.overlayClassName}
                  >
                    <ClickableIconContainer size={28}>
                      <More />
                    </ClickableIconContainer>
                  </Dropdown>
                </div>}
              </div>
            </div>
          );
        });
      } else {
        JSX = (
          <div className={css.loading}>
            暂无内容，请添加...
          </div>
        )
      }
    } else {
      JSX = (
        <div className={css.loading}>
          加载中，请稍后..
        </div>
      );
    }
    return (
      <div className={css.files}>
        {JSX}
      </div>
    );
  });

  const modalOk = useCallback((values, app) => {
    return new Promise(async (resolve, reject) => {
      const { name } = values
      const item = ctx.path.at(-1)
      const isGroup = !!!item.extName && !!item.id
      const { extName, isSystem } = app
      const params: any = {
        extName,
        userId: appCtx.user.email
      }

      if (isGroup) {
        params.groupId = item.id
      } else {
        params.parentId = item.id
        params.groupId = item.groupId
      }
      
      const check = await axios({
        method: 'get',
        url: getApiUrl('/paas/api/file/checkFileCanCreate'),
        params: {
          ...params,
          fileName: name
        }
      })

      if (check.data?.data?.next) {
        if (isSystem) {
          params.type = 'system'
        }
  
        axios({
          method: 'post',
          url: getApiUrl('/paas/api/file/rename'),
          data: {
            id: app.id,
            name,
            userId: appCtx.user.email
          }
        }).then(async ({data}) => {
          if (data.code === 1) {
            ctx.getAll(getUrlQuery())

            if (folderExtnames.includes(extName)) {
              await appCtx.refreshSidebar()
            }

            resolve('重命名成功！')
          } else {
            reject(`重命名错误：${data.message}`)
          }
        })
      } else {
        reject('相同路径下不允许有同名文件！')
      }
    })
  }, [])

  const modalCancel = useCallback(() => {
    setCreateApp(null)
  }, [])

  const RenderRenameFileModal = useMemo(() => {
    return (
      <RenameFileModal
        app={createApp}
        onOk={modalOk}
        onCancel={modalCancel}
      />
    )
  }, [createApp])

  return (
    <>
      {Render}
      {RenderRenameFileModal}
    </>
  );
}

function ClickableIconContainer({className = '', size = 28, children}) {
  return (
    <div className={`${css.clickableIconContainer} ${className}`} style={{width: size, height: size}}>
      {children}
    </div>
  )
}

function RenameFileModal({app, onOk, onCancel}) {
  const [form] = Form.useForm()
  const [btnLoading, setBtnLoading] = useState(false)
  const ref = useRef()

  const ok = useCallback(() => {
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
  }, [app])

  const cancel = useCallback(() => {
    onCancel()
    setBtnLoading(false)
    form.resetFields()
  }, [])

  useEffect(() => {
    if (app && ref.current) {
      setTimeout(() => {
        (ref.current as any).focus()
      }, 100)
    }
  }, [app])

  return (
    <Modal
      open={!!app}
      title={'重命名'}
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
      >
        <Form.Item
          label='名称'
          name='name'
          rules={[{ required: true, message: '请输入新的名称', validator(rule, value) {
            return new Promise((resolve, reject) => {
              if (!value.trim()) {
                reject(rule.message)
              } else [
                resolve(true)
              ]
            })
          }}]}
        >
          <Input ref={ref} placeholder='请输入新的名称' autoFocus onPressEnter={ok}/>
        </Form.Item>
      </Form>
    </Modal>
  )
}
