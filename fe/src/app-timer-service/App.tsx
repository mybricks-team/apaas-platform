import css from "./App.less";
import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { GoBack } from "./Icons";
import { getApiUrl, getCookie, getQueryString } from "../utils";

import axios from "axios";
import { useComputed, useObservable } from "@mybricks/rxui";
import { APP_TYPE_TIMER_SERVICE, APPS, COOKIE_LOGIN_USER, TaskTypeMap } from "../constants";
import { Modal } from 'antd';

import config from './app-config'

import moment from 'moment';
import * as htmlToImage from 'html-to-image';
import createCompiler from "./compile-code";

class Ctx {
  user

  fileId

  fileItem

  expStr

  setContent(content) {
    this.save({ content })
  }

  setName(name) {
    this.fileItem.name = name
    this.save({ name })
  }

  // setPreviewImg(geoView) {
  //   return new Promise((resolve, reject) => {
  //     if (geoView) {
  //       setTimeout(v => {
  //         const dom = geoView.canvasDom as HTMLDivElement
  //         const div = document.createElement('div')
  //         div.style.width = 'fit-content'
  //         div.appendChild(dom)
  //
  //         document.body.append(div)
  //
  //         htmlToImage.toPng(dom).then((base64) => {
  //           resolve(base64);
  //         }).catch(ex => {
  //           console.error(ex)
  //           reject(ex);
  //         }).finally(() => {
  //           document.body.removeChild(div)
  //         })
  //       })
  //     }
  //   })
  //
  // }

  share(shareType) {
    this.fileItem.shareType = shareType
    this.save({ shareType })
  }

  save({ name, shareType, content, icon }: { name?, shareType?, content?, icon?}, skipMessage?: boolean) {
    if (this.user && this.user.email === this.fileItem?.creatorId) {
      axios({
        method: "post",
        url: getApiUrl('/api/workspace/saveFile'),
        data: {
          userId: ctx.user?.email,
          fileId: ctx.fileId,
          name,
          shareType,
          content,
          icon
        }
      }).then(({ data }) => {

        if (skipMessage) {
          return;
        }

        if (data.code === 1) {
          message.info(`保存完成`)
        } else {
          message.error(`保存失败：${data.message}`)
        }
      })
    }
  }
}

let ctx: Ctx

export default function App() {
  const [D, setD] = useState();
  const [beforeunload, setBeforeunload] = useState(false);

  useEffect(() => {
    if (beforeunload) {
      window.onbeforeunload = () => {
        return true;
      };
    } else {
      window.onbeforeunload = null;
    }
  }, [beforeunload]);

  ctx = useObservable(Ctx, next => {
    let user
    const userCookie = getCookie(COOKIE_LOGIN_USER)
    if (userCookie) {
      user = JSON.parse(userCookie)
    }

    const fileId = getQueryString('id')
    next({
      user,
      fileId
    })
  });

  const onEdit = useCallback(() => {
    setBeforeunload(true);
  }, [setBeforeunload]);

  useMemo(() => {
    axios({
      method: "get",
      url: getApiUrl('/api/workspace/getFullFile'),
      params: { userId: ctx.user?.email, fileId: ctx.fileId }
    }).then(({ data }) => {
      if (data.code === 1) {
        ctx.fileItem = data.data
      } else {
        message.error(`获取数据发生错误：${data.message}`)
      }
    })
  }, [])

  const designerRef = useRef<{ dump, toJSON, geoView }>()

  const save = useCallback(() => {//保存
    const json = designerRef.current?.dump();

    let expStr = ctx.expStr || json?.cronConfig?.expStr || "";

    Object.assign(json, {
      cronConfig: {
        expStr: expStr
      }
    })
    ctx.setContent(JSON.stringify(json));
    setBeforeunload(false);

    // ctx.setPreviewImg(designerRef.current?.geoView).then((icon) => {
    //   ctx.save({
    //     icon: icon
    //   }, true);
    // }).catch(err => {
    //   console.error(err);
    // });

  }, [setBeforeunload])

  // const createTask = () => {
  //   return axios({
  //     method: "post",
  //     url: getApiUrl('/api/task/create'),
  //     data: {
  //       userId: ctx.user.email,
  //       fileId: ctx.fileId,
  //       name: `${name}在${moment.now()}发布的任务`,
  //       type: APP_TYPE_TIMER_SERVICE,
  //       content: code,
  //       // meteinfo: { cronConfig: {type, exp} }
  //       metaInfo: JSON.stringify({
  //         cronConfig: {
  //           type: TaskTypeMap.NORMAL, // 1 立即执行 非1则取下面exp
  //           exp: expStr
  //         }
  //       }),
  //     }
  //   });
  // }

  const publish = useCallback(() => {
    let dumpJson = designerRef.current?.dump();
    let json = designerRef.current?.toJSON();
    let code = createCompiler(json, (window as any).__comlibs_edit_);
    console.log(code);

    let expStr = ctx.expStr || dumpJson.cronConfig.expStr;

    axios({
      method: "post",
      url: getApiUrl('/api/task/checkStatusByFile'),
      data: {
        userId: ctx.user.email,
        fileId: ctx.fileId,
        type: APP_TYPE_TIMER_SERVICE,
      }
    }).then(({ data }) => {
      // existRunningTask: 是否存在运行中task，runningId：正在运行的taskID
      const { existRunningTask, runningId } = data.data;

      if (existRunningTask) {
        Modal.confirm({
          title: '确认提醒',
          content: '当前有定时任务正在执行中，发布将导致任务中止，是否继续',
          okText: '继续',
          cancelText: '取消',
          onOk: () => {

            axios({
              method: "post",
              url: getApiUrl('/api/task/stop'),
              data: {
                userId: ctx.user.email,
                id: runningId,
              }
            }).then(({ data }) => {
              //////////////////
              axios({
                method: "post",
                url: getApiUrl('/api/task/create'),
                data: {
                  userId: ctx.user.email,
                  fileId: ctx.fileId,
                  name: `${ctx.fileItem.name}的定时任务`,
                  type: APP_TYPE_TIMER_SERVICE,
                  content: code,
                  // meteinfo: { cronConfig: {type, exp} }
                  metaInfo: JSON.stringify({
                    cronConfig: {
                      type: TaskTypeMap.NORMAL, // 1 立即执行 非1则取下面exp
                      exp: expStr
                    }
                  }),
                }
              }).then(({ data }) => {
                if (data.code === 1) {


                  let taskId = data.data.id;
                  axios({
                    method: "post",
                    url: getApiUrl('/api/task/run'),
                    data: {
                      userId: ctx.user.email,
                      id: taskId
                    }
                  }).then(({ data }) => {
                    if (data.code === 1) {
                      message.info(`发布成功`)
                    } else {
                      message.error(`发布失败：${data.message}`)
                    }
                  });

                } else {
                  message.error(`发布失败：${data.message}`)
                }
              })
              //////////////////

            })

          }
        });
      } else {

        //////////////////

        axios({
          method: "post",
          url: getApiUrl('/api/task/create'),
          data: {
            userId: ctx.user.email,
            fileId: ctx.fileId,
            name: `${ctx.fileItem.name}的定时任务`,
            type: APP_TYPE_TIMER_SERVICE,
            content: code,
            // meteinfo: { cronConfig: {type, exp} }
            metaInfo: JSON.stringify({
              cronConfig: {
                type: TaskTypeMap.NORMAL, // 1 立即执行 非1则取下面exp
                exp: expStr
              }
            }),
          }
        }).then(({ data }) => {
          if (data.code === 1) {

            let taskId = data.data.id;
            axios({
              method: "post",
              url: getApiUrl('/api/task/run'),
              data: {
                userId: ctx.user.email,
                id: taskId
              }
            }).then(({ data }) => {
              if (data.code === 1) {
                message.info(`发布成功`)
              } else {
                message.error(`发布失败：${data.message}`)
              }
            });

          } else {
            message.error(`发布失败：${data.message}`)
          }
        })
        //////////////////
      }

    })



    //
    // window.localStorage.setItem(`--preview-${ctx.fileId}-`, JSON.stringify(json))
    //
    // window.open(`/preview.html?id=${ctx.fileId}`)
  }, [])

  const onTest = useCallback(() => {
    let json = designerRef.current?.toJSON();
    let code = createCompiler(json, (window as any).__comlibs_edit_);
    console.log(code);
    axios({
      method: "post",
      url: getApiUrl('/api/task/create'),
      data: {
        userId: ctx.user.email,
        fileId: ctx.fileId,
        name: `${ctx.fileItem.name}的定时任务`,
        type: APP_TYPE_TIMER_SERVICE,
        content: code,
        // meteinfo: { cronConfig: {type, exp} }
        metaInfo: JSON.stringify({
          cronConfig: {
            type: TaskTypeMap.IMMEDIATE, // 1 立即执行 非1则取下面exp
            exp: ''
          }
        }),
      }
    }).then(({ data }) => {
      if (data.code === 1) {

        let taskId = data.data.id;
        axios({
          method: "post",
          url: getApiUrl('/api/task/run'),
          data: {
            userId: ctx.user.email,
            id: taskId
          }
        }).then(({ data }) => {
          if (data.code === 1) {
            message.success(`测试成功`)
          } else {
            message.error(`测试失败：${data.message}`)
          }
        });

      } else {
        message.error(`发布失败：${data.message}`)
      }
    })
  }, [])

  const goBack = useCallback(() => {
    window.history.back();
  }, [])

  useComputed(() => {
    if (ctx.fileItem) {
      import('@mybricks/designer-topl').then(Designer => {
        setD(Designer.default as any)
      })
    }
  })

  return (
    <div className={css.view}>
      <div className={css.toolbar}>
        <div className={css.icon} onClick={goBack}>
          {GoBack}
        </div>
        <div className={css.projectName}
          style={{ marginRight: 'auto' }}>{ctx.fileItem?.name}</div>
        {
          (ctx.user && ctx.user.email === ctx.fileItem?.creatorId) ? (
            <button className={css.primary} onClick={save}>保存</button>
          ) : null
        }
        <button onClick={publish}>发布</button>
        <button onClick={onTest}>测试</button>
      </div>
      <div className={css.designer}>
        {
          D ? (
            <D config={config(ctx)} ref={designerRef} onEdit={onEdit} />
          )
            : (
              <div className={css.loading}>加载中...</div>
            )
        }
      </div>
    </div>
  )
}

