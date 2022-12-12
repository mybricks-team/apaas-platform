import { render } from 'react-dom'
import { render as renderUI } from '@mybricks/render-web'//使用Mybricks-web渲染器
import { call as callConnectorHttp } from "@mybricks/plugin-connector-http";
import { getQueryString } from './utils'

const fileId = getQueryString('fileId');

let json = localStorage.getItem(`--preview-${fileId}-`)

if (!json) {
  throw new Error('数据错误')
}

try {
  json = JSON.parse(json)
} catch (ex) {
  throw ex
}


//----------------------------------------------------------------------------

render(<Page />, document.querySelector('#root'))

function Page() {
  return (
    <div>
      {
        renderUI(json, {//渲染Mybricks toJSON的结果
          env: {//配置组件运行的各类环境信息
            i18n(text) {//多语言
              return text
            },
            callConnector(connector, params) {//调用连接器
              if (connector.type === 'http') {//服务接口类型
                return callConnectorHttp({ script: connector.script, params })
              } else {
                return Promise.reject('错误的连接器类型.')
              }
            },
          },
        })
      }
    </div>
  )
}