import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {message} from "antd";
import css from "./ShowDesigner.less";
import {FullScreen, RecoverScreen} from "./Icons";

export default function ShowDesigner() {
  const [D, setD] = useState()
  const [showFull, setShowFull] = useState(false)

  const designerRef = useRef<{ dump, toJSON }>()

  const save = useCallback(() => {//保存
    const json = designerRef.current?.dump()
    window.localStorage.setItem('--mybricks--', JSON.stringify(json))
    message.info(`保存完成`)
  }, [])

  const preview = useCallback(() => {
    const json = designerRef.current?.toJSON()
    window.localStorage.setItem('--pubdata--', JSON.stringify(json))
    window.open('/preview.html')
  }, [])

  const switchShow = useCallback(() => {
    setShowFull(!showFull)
  }, [showFull])

  useMemo(() => {
    import('@mybricks/designer-spa').then(Designer => {
      setD(Designer.default as any)
    })
  }, [])

  useEffect(() => {
    setTimeout(v => {
      document.body.style.overflow = 'auto'
    }, 2000)
  }, [designerRef.current])

  return (
    <>
      <div className={`${css.show} ${showFull ? css.fullScreen : ''}`}>
        <div className={css.toolbar}>
          <div className={css.icon} onClick={switchShow}>
            {showFull ? RecoverScreen : FullScreen}
          </div>
          <div className={css.defined} style={{marginRight: 'auto'}}>&lt;定制标题&gt;</div>
          <div className={css.defined}>&lt;定制按钮&gt;</div>
          <div className={css.defined}>&lt;定制按钮&gt;</div>
          {/*<button className={css.primary} onClick={save}>保存</button>*/}
          {/*<button onClick={preview}>预览</button>*/}
        </div>
        <div className={css.designer}>
          {
            D ? (
                <D config={config} ref={designerRef}/>
              )
              : (
                <div className={css.loading}>加载中...</div>
              )
          }

        </div>
      </div>
    </>
  )
}

//---------------------------------------------------------------------------------

function callConnectorHttp({script, params}) {
  return new Promise((resolve, reject) => {
    try {
      const fn = eval(`(${script})`)
      fn(params, {then: resolve, onError: reject}, {
        ajax(opts) {
          let url = opts.url
          let headers
          let body

          if (opts.method.toUpperCase() === 'GET') {
            if (params) {
              let arr = []
              for (let objKey in params) {
                arr.push(objKey + "=" + params[objKey]);
              }
              url += `?${arr.join("&")}`
            }
          } else if (opts.method.toUpperCase() === 'POST') {
            if (params) {
              body = JSON.stringify(params)
              //headers = {'Content-Type': 'x-www-form-urlencoded;charset=UTF-8'}
              headers = {'Content-Type': 'application/json'}
            }
          }

          return new Promise((resolve1, reject1) => {
            window.fetch(url, {method: opts.method, body, headers})
              .then(response => {
                if (String(response.status).match(/^2\d{2}$/g)) {
                  if (response && typeof response.json === 'function') {
                    try {
                      return response.json()
                    } catch (ex) {
                      reject1(ex.message)
                    }
                  } else {
                    resolve1('')
                  }
                } else {
                  reject1(`服务连接错误（状态码 ${response.status}）`)
                }
              })
              .then(data => {
                resolve1(data)
              })
              .catch(err => {
                reject1(err.message)
              })
          })
        }
      })
    } catch (ex) {
      reject(`连接器script错误.`)
    }
  })
}

const config = {
  comLibLoader(desc) {//加载组件库
    return new Promise((resolve, reject) => {
      resolve([`https://f2.eckwai.com/kos/nlav12333/fangzhou/pub/comlibs/5665_1.0.44/2022-11-14_16-36-52/edit.js`])
      //resolve([testLib])
    })
  },
  pageContentLoader() {//加载页面内容
    return new Promise((resolve, reject) => {
      let pageContent = window.localStorage.getItem('--mybricks--')
      if (pageContent) {
        pageContent = JSON.parse(pageContent)

        resolve(pageContent)
      } else {
        // resolve(null)
        // return
        import('./demo-data.json').then(data => {
          pageContent = JSON.parse(JSON.stringify(data))
          resolve(pageContent)
        })
      }
    })
  },
  com: {
    env: {
      i18n(title) {//多语言
        return title
      },
      callConnector(connector, params) {//调用连接器
        if (connector.type === 'http') {//服务接口类型
          return callConnectorHttp({script: connector.script, params})
        } else {
          return Promise.reject('错误的连接器类型.')
        }
      },
    },
    events: [//配置事件
      {
        type: 'jump',
        title: '跳转到',
        exe({options}) {
          const page = options.page
          if (page) {
            window.location.href = page
          }
        },
        options: [
          {
            id: 'page',
            title: '页面',
            editor: 'textarea'
          }
        ]
      },
    ]
  },
}

