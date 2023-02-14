import React, {useEffect, useMemo} from 'react';
import axios from 'axios';
import {message} from 'antd';
import {observe, useComputed, useObservable} from '@mybricks/rxui';

import TitleBar from './title';

import {Block, Content} from '..';
import {Projects} from './projects';
import {getApiUrl} from '../../../utils';
import WorkspaceContext, {User} from '../../WorkspaceContext';
import Ctx from "./Ctx";

export default function MyProjects({user}) {
  const wsCtx = observe(WorkspaceContext, {from: 'parents'})

  const ctx: Ctx = useObservable(Ctx, next => {
    next({
      user,
      path: [{id: null, name: '我的项目', parentId: null}],
      projectList: null,
      getAll(pushState = false) {
        const parentId = ctx.path[ctx.path.length - 1].id;

        if (pushState) {
          wsCtx.setUrlQuery('id', parentId);
        }

        axios({
          method: "get",
          url: getApiUrl('/api/workspace/getAll'),
          params: {userId: user.email, parentId}
        }).then(({data}) => {
          if (data.code === 1) {
            const folderAry: any = [];
            const fileAry: any = [];

            data.data.forEach((item) => {
              const {extName} = item;
              if (extName === 'folder') {
                folderAry.push(item);
              } else {
                fileAry.push(item);
              }
            });

            ctx.projectList = folderAry.concat(fileAry);
          } else {
            message.error(`获取数据发生错误：${data.message}`);
            ctx.projectList = [];
          }
        }).catch(ex => {
          message.error(`获取数据发生错误：${ex.message}`);
          ctx.projectList = [];
        });
      },
      setPath(id: string | null, pushState = false) {
        ctx.projectList = null;
        const path = ctx.path.slice(0, 1);

        if (!id) {
          ctx.path = path;
          ctx.getAll(pushState);
        } else {
          axios({
            method: "get",
            url: getApiUrl('/api/workspace/getFilePath'),
            params: {userId: user.email, fileId: id}
          }).then((res) => {
            const {code, data} = res.data;
            if (code === 1) {
              if (data.length) {
                path.push(...data);
              }
            } else {
              message.error(`获取数据发生错误：${data.message}`);
            }
            ctx.path = path;
          }).catch(ex => {
            message.error(`获取数据发生错误：${ex.message}`);
            ctx.path = path;
          }).finally(() => {
            ctx.getAll(pushState);
          });
        }
      }
    })
  }, {to: 'children'});

  useComputed(() => {
    const {urlQuery: {id}} = wsCtx;

    setTimeout(() => {
      ctx.setPath(id);
    });
  });

  return (
    <>
      <Content title={<TitleBar/>}>
        <Block style={{flex: 1, height: 0, marginBottom: 0}}>
          <Projects/>
        </Block>
      </Content>
    </>
  );
}


