import React, { useEffect, useState, useMemo, useCallback } from 'react'

import { useObservable, useComputed } from '@mybricks/rxui'
import CreateFile from '@mybricks-cloud/create-application'

import Ctx from './Ctx'
import { Block, Content } from '..'
import { eventOperation, getApiUrl, getUrlQuery, isArray } from '../../../utils'
import { UserGroup } from '../../icon'
import FileIcon from '../../icon/file-icon'
import { IconDelete, UserGroupConfig } from '../../icon'

import css from './index.less'
import axios from 'axios';
import { message } from 'antd'

import MyProjects from '../myProjects'

let ctx

export default function Group ({user, urlPrefix}) {
  const [show, setShow] = useState(false)
  ctx = useObservable(Ctx, (next) => {
    next({
      user,
      getAll(pushState = true) {
        // const curPath = ctx.path[ctx.path.length - 1]
        // const parentId = curPath.id
        // const extName = curPath.extName
        // ctx.folderExtName = extName
        // const urlQuery = getUrlQuery()
        // const {app} = urlQuery
        // const url = `?app=${app}${parentId ? `&id=${parentId}` : ''}`;

        // if (pushState) {
        //   history.pushState(null, "", url);
        // } else {
        //   history.replaceState(JSON.parse(JSON.stringify(urlQuery)), "", url);
        // }

        // axios({
        //   method: "get",
        //   url: getApiUrl('/api/workspace/getAll'),
        //   params: {userId: user.email, parentId}
        // }).then(({data}) => {
        //   if (data.code === 1) {
        //     const folderAry: any = [];
        //     const fileAry: any = [];

        //     data.data.forEach((item) => {
        //       const {extName} = item;
        //       if (folderExtnames.includes(extName)) {
        //         folderAry.push(item);
        //       } else {
        //         fileAry.push(item);
        //       }
        //     });

        //     ctx.projectList = folderAry.concat(fileAry);
        //   } else {
        //     message.error(`获取数据发生错误：${data.message}`);
        //     ctx.projectList = [];
        //   }
        // }).catch(ex => {
        //   message.error(`获取数据发生错误：${ex.message}`);
        //   ctx.projectList = [];
        // });
      },
      setPath(id: string | null) {
        ctx.id = id
        ctx.list = null

        if (!id) {
          axios({
            method: 'get',
            url: getApiUrl('/paas/api/userGroup/getVisibleGroups'),
            params: {
              userId: ctx.user.email
            }
          }).then(({data}) => {
            ctx.list = (data.code === 1 && Array.isArray(data.data)) ? data.data : []
          }).catch((err) => {
            ctx.list = []
            message.error(`获取数据发生错误：${err.message}`);
          })
          setShow(true)
        } else {
          axios({
            method: 'get',
            url: getApiUrl('/paas/api/userGroup/queryById'),
            params: {
              id
            }
          }).then(({data}) => {
            if (data.code === 1) {
              ctx.item = data.data
            }
            setShow(true)
          })
        }
      }
    })
  }, {to: 'children'})

  useMemo(() => {
    const urlQuery = getUrlQuery()
    const { groupId } = urlQuery
    ctx.setPath(groupId)
  }, [])

  useEffect(() => {
    const fn = () => {
      const urlQuery = getUrlQuery();
      const { groupId } = urlQuery;

      if (Number(groupId) !== ctx.id) {
        ctx.setPath(groupId)

        history.replaceState(null, "", urlPrefix)
      }
    }
    window.addEventListener("popstate", fn);

    return () => {
      window.removeEventListener("popstate", fn)
    }
  }, [])

  return show && (!ctx.id ? (
    <Content title={<TitleBar/>}>
      <Block style={{flex: 1, height: 0, marginBottom: 0}}>
        <List />
      </Block>
    </Content>
  ) : (
    <MyProjects
      user={user}
      urlPrefix={`${urlPrefix}&groupId=${ctx.id}`}
      path={[{...ctx.item, type: 'group'}]}
      groupId={ctx.id}
      filterCondition={{
        groupId: ctx.id
      }}
    />
  ));
}

function TitleBar () {
  const [createFileVisible, setCreateFileVisible] = useState<any>(1)

  const addGroup = useCallback(() => {
    setCreateFileVisible(true)
  }, [])

  /** 创建应用弹窗提交事件 */
  const createFileSubmit = useCallback((value) => {
    const { name } = value
    const userId = ctx.user.email
    axios({
      method: 'post',
      url: getApiUrl('/paas/api/userGroup/create'),
      data: {
        name,
        userId
      }
    }).then(({data}) => {
      if (data.code === 1) {
        ctx.setPath()
      } else {
        message.error(`创建协作组错误:${data.message}`)
      }
    }).finally(() => {
      setCreateFileVisible(false);
    });
  }, []);

  /** 创建应用弹窗关闭事件 */
  const createFileClose = useCallback(() => {
    setCreateFileVisible(false);
  }, [])

  /** 创建各类应用弹窗 */
  const RenderCreateFile: JSX.Element = useMemo(() => {
    if (typeof createFileVisible === 'number') {
      return <></>;
    }
    return (
      <div style={{display: 'none'}}>
        <CreateFile
          title='新建协作组'
          visible={createFileVisible}
          submit={createFileSubmit}
          close={createFileClose}
        />
      </div>
    )
  }, [createFileVisible]);

  return (
    <div className={css.titleBar}>
      <div>协作组</div>
      <div className={css.btns}>
        <button onClick={eventOperation(addGroup).stop}><span>+</span>新建</button>
      </div>
      {RenderCreateFile}
    </div>
  )
}

function List() {
  const [createFileVisible, setCreateFileVisible] = useState<any>(1)

  const addUser = useCallback(() => {
    setCreateFileVisible(true)
  }, [])

  /** 创建应用弹窗提交事件 */
  const createFileSubmit = useCallback((value) => {
    const { name } = value
    const userId = ctx.user.email

    console.log(name, 'name')

    // /userGroup/addUserGroupRelation

    // userId, userIds, roleDescription, groupId

    axios({
      method: 'post',
      url: getApiUrl('/paas/api/userGroup/addUserGroupRelation'),
      data: {
        userId,
        roleDescription: 1,
        groupId: ctx.item.id,
        userIds: name.split(',')
      }
    }).then(({data}) => {
      if (data.code === 1) {
        message.success('配置成功')
      }
    })
  }, []);

  /** 创建应用弹窗关闭事件 */
  const createFileClose = useCallback(() => {
    setCreateFileVisible(false);
  }, [])

  const RenderCreateFile: JSX.Element = useMemo(() => {
    if (typeof createFileVisible === 'number') {
      return <></>;
    }
    return (
      <div style={{display: 'none'}}>
        <CreateFile
          title='配置协作人员,以英文逗号隔开'
          visible={createFileVisible}
          submit={createFileSubmit}
          close={createFileClose}
        />
      </div>
    )
  }, [createFileVisible]);

  const operate = useCallback((type, item) => {
    switch(type) {
      case 'delete':
        if (confirm('您确定要删除该协作组吗?')) {
          axios({
            method: "post",
            url: getApiUrl('/paas/api/userGroup/delete'),
            data: {id: item.id, userId: ctx.user.email}
          }).then(({data}) => {
            if (data.code === 1) {
              ctx.setPath()
            } else {
              message.error(data.data.message)
            }
          });
        }
        break
      case 'open':
        ctx.id = item.id
        ctx.item = item
        break
      case 'config':
        addUser()
        ctx.item = item
        break
      default:
        break
    }
  }, [])

  const Render: JSX.Element | JSX.Element[] = useComputed(() => {
    let JSX: JSX.Element | JSX.Element[] = <></>;
    const list = ctx.list
    if (isArray(list)) {
      if (list.length) {
        JSX = list.map((item) => {
          return (
            <div key={item.id} className={css.file} onClick={eventOperation(() => operate('open', item)).stop}>
              <div className={css.snap}>
                <FileIcon urlIcon={item.icon} icon={UserGroup} big={true}/>
              </div>
              <div className={css.tt}>
                <div className={css.typeIcon}>
                  <FileIcon icon={UserGroup} width={18}/>
                </div>
                <div className={css.detail}>
                  <div className={css.name}>
                    {item.name}
                  </div>
                  <div className={css.path}>
                    {item.creatorName}
                  </div>
                </div>
                <div className={css.btns}>
                  <span onClick={eventOperation(() => operate('config', item)).stop}>
                    <UserGroupConfig width={32} height={32}/>
                  </span>
                  <span onClick={eventOperation(() => operate('delete', item)).stop}>
                    <IconDelete width={32} height={32}/>
                  </span>
                </div>
              </div>
            </div>
          );
        })
      } else {
        JSX = (
          <div className={css.loading}>
            暂无可见的协作组，请添加或联系其它协作组管理员分配权限...
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
      <div className={css.list}>
        {JSX}
      </div>
    )
  });

  return (
    <>
      {Render}
      {RenderCreateFile}
    </>
  );
}
