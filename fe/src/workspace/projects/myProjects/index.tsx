import React, { useMemo } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { useComputed, useObservable } from 'rxui-t';

import { Title } from './title';
import { Create } from './create';
import { Projects } from './projects';
import { getApiUrl } from '../../../utils';
import WorkspaceContext, { User } from '../../WorkspaceContext';

export interface Ctx {
  path: Array<{id: null | number, name: string, parentId: null | number}>;
  projectList: null | Array<any>;
  /**
   * @param pushState 是否操作路由
   */
  getAll: (pushState?: boolean) => void;
  /**
   * @param id 文件夹Id
   * @param pushState 是否操作路由
   */
  setPath: (id: number | string | null, pushState?: boolean) => void;
}

export interface ChildPanelProps {
  ctx: Ctx;
  user: User;
}

export default function MyProjects ({user}) {
  const ctx: Ctx = useObservable({
    path: [{id: null, name: '我的项目', parentId: null}],
    projectList: null,
    getAll(pushState = false) {
      const parentId = ctx.path[ctx.path.length - 1].id;

      if (pushState) {
        WorkspaceContext.setUrlQuery('id', parentId);
      }

      axios({
        method: "get",
        url: getApiUrl('/api/workspace/getAll'),
        params: { userId: user.email, parentId }
      }).then(({data}) => {
        if (data.code === 1) {
          const folderAry: any = [];
          const fileAry: any = [];

          data.data.forEach((item) => {
            const { extName } = item;
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
          params: { userId: user.email, fileId: id }
        }).then((res) => {
          const { code, data } = res.data;
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
  });

  useComputed(() => {
    const { urlQuery: { id } } = WorkspaceContext;

    setTimeout(() => {
      ctx.setPath(id);
    });
  });

  return (
    <>
      <Block>
        <Title user={user} ctx={ctx} />
      </Block>
      <Block>
        <Create user={user} ctx={ctx} />
      </Block>
      <Block style={{flex: 1, height: 0, marginBottom: 0}}>
        <Projects user={user} ctx={ctx} />
      </Block>
    </>
  );
}

function Block ({style = {}, children}): JSX.Element {
  return (
    <div style={{marginBottom: 11, ...style}}>
      {children}
    </div>
  );
}
