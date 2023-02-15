import React, {useCallback} from 'react';
import axios from 'axios';
import {message} from 'antd';
import {observe, useComputed} from '@mybricks/rxui';
import {IconDelete} from '../../../icon';
import WorkspaceContext from '../../../WorkspaceContext';
import {eventOperation, getApiUrl} from '../../../../utils';
import FileIcon from '../../../icon/file-icon';

import css from './index.less';
import Ctx, { folderExtnames } from "../Ctx";

/** 项目列表 */
export function Projects(): JSX.Element {
  const wsCtx = observe(WorkspaceContext, {from: 'parents'})

  const ctx = observe(Ctx, {from: "parents"})

  /** 各种操作 */
  const operate = useCallback((type, item) => {
    const {id, name, extName, parentId, homepage} = item;
    switch (type) {
      case 'open':
        if (!folderExtnames.includes(extName)) {
          window.location.href = `${homepage}?id=${id}`;
        } else {
          ctx.setPath(id, true);
        }
        break;
      case 'delete':
        if (confirm('您确定要删除该项目吗?')) {
          axios({
            method: "post",
            url: getApiUrl('/api/workspace/deleteFile'),
            data: {id: item.id, userId: wsCtx.user.email}
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
        const {APPSMap} = wsCtx;
        JSX = ctx.projectList.map((project) => {
          const {extName} = project
          const appReg = APPSMap[extName];

          if (!appReg) {
            return <></>;
          }

          const {icon, homepage} = appReg;

          return (
            <div key={project.id} className={css.file} onClick={() => operate('open', {...project, homepage})}>
              <div className={css.snap}>
                <FileIcon urlIcon={project.icon} icon={icon} big={folderExtnames.includes(extName)}/>
              </div>
              <div className={css.tt}>
                <div className={css.typeIcon}>
                  <FileIcon icon={icon} width={18}/>
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
                  <span onClick={eventOperation(() => operate('delete', project)).stop}>
                    <IconDelete width={32} height={32}/>
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

