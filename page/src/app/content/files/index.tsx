import React, {useCallback, useEffect} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {
  evt,
  observe,
  useComputed,
  useObservable
} from '@mybricks/rxui'

import Box from './box'
import TitleBar from './title'
import AppCtx from '../../AppCtx'
import {Content, Block} from '..'
import {getApiUrl} from '../../../utils'
import Ctx, {folderExtnames} from './Ctx'
import {Icon, Trash} from '../../components'

import css from './index.less'

export default function Files() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = useObservable(Ctx, next => {
    next({
      setPath({parentId, groupId}) {
        ctx.projectList = null
        const path = !groupId ? [{id: null, name: '我的项目', parentId: null, extName: null}] : []

        axios({
          method: "get",
          url: getApiUrl('/api/file/getFilePath'),
          params: {userId: appCtx.user.email, fileId: parentId, groupId}
        }).then(({data: {data}}) => {
          if (data.length) {
            path.push(...data)
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
  const latestPath = useComputed(() => {
		return ctx.path[ctx.path.length - 1]
	})

  useComputed(() => {
    const {urlQuery} = appCtx
    const {parentId, groupId} = urlQuery
    setTimeout(() => {
      ctx.setPath({parentId, groupId})
    })
  })

  return (
    <>
      <Content title={<TitleBar/>}>
        <Block style={{flex: 1, height: 0, marginBottom: 0, display: 'flex'}}>
	        <Block style={{ flex: 1, marginBottom: 0 }}>
		        <Projects/>
	        </Block>
	        {latestPath?.extName === 'folder-module' ? (
		        <Block style={{width: '300px', marginBottom: 0}}>
			        <Box />
		        </Block>
	        ) : null}
        </Block>
      </Content>
    </>
  );
}

function Projects() {
  const appCtx = observe(AppCtx, {from: 'parents'})
  const ctx = observe(Ctx, {from: "parents"})

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
        if (confirm('您确定要删除该项目吗?')) {
          axios({
            method: "post",
            url: getApiUrl('/api/workspace/deleteFile'),
            data: {id: item.id, userId: appCtx.user.email}
          }).then(({data}) => {
            if (data.code === 1) {
              ctx.getAll(true);
            } else {
              message.error(`删除项目错误：${data.message}`);
            }
          });
        }
        break;
      default:
        break;
    }
  }, []);

  /** 渲染项目列表 */
  const Render: JSX.Element | JSX.Element[] = useComputed(() => {
    let JSX: JSX.Element | JSX.Element[] = <></>;
    if (Array.isArray(ctx.projectList)) {
      if (ctx.projectList.length) {
        const {APPSMap} = appCtx;
        console.log(APPSMap, 'APPSMap')
        JSX = ctx.projectList.map((project) => {
          const {extName} = project
          const appReg = APPSMap[extName];

          if (!appReg) {
            return <></>;
          }

          const {icon, homepage} = appReg;
          const bigIcon = folderExtnames.includes(extName) || project.icon

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
                <div className={css.btns}>
                  <span onClick={evt(() => operate('delete', project)).stop}>
                    <Trash width={32} height={32}/>
                  </span>
                </div>
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

  return (
    <>
      {Render}
    </>
  );
}