import React, { useState, useRef, useEffect, useCallback } from "react";
import { Terminal } from 'xterm'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

import { Form, Radio, Input, Button, Switch, message } from 'antd'
import axios from 'axios'
import { getApiUrl } from "@/utils";

let term = new Terminal({
  // 渲染类型
  rendererType: 'canvas',
  //   是否禁用输入
  disableStdin: true,
  cursorStyle: 'underline',
  //   启用时光标将设置为下一行的开头
  convertEol: true,
  // 终端中的回滚量
  // scrollback: 10,
  fontSize: 14,
  // rows: 20,
  // 光标闪烁
  // cursorBlink: true,
  fontFamily: "Monaco,Mono,Consolas,Liberation Mono,Menlo,monospace",
  theme: {
    //   字体
    // foreground: '#ffffff',
    background: '#000000',
    // 光标
    // cursor: 'help',
    // lineHeight: 18,
  },
  onLineFeed: (data) => {
    console.log(data)
  },
  onData: (data) => {
    console.log('onData', data)
    
  },
  onScroll: (data) => {
    console.log('onScroll', data)
  }
})
const searchAddon = new SearchAddon()
const fitAddon = new FitAddon()
const weblinkAddon = new WebLinksAddon()

export default function Term() {
  const [ realtimeRefresh, setRealtimeRefresh ] = useState(false)

  const [form] = Form.useForm();

  const getLogStr = async (str?: string) => {
    console.log('str', str)
    return new Promise((resolve, reject) => {
      axios.post(getApiUrl('/paas/api/log/runtimeLog/search'), { searchValue: str }).then(({ data }) => {
        if(data.code === 1) {
          resolve(data.data)
        }
      })
    })
  }

  useEffect(() => {
    //   创建实例
    term.open(document.getElementById('ter'))
    // 进行适应容器元素大小
    term.loadAddon(fitAddon)
    fitAddon.fit()
    term.loadAddon(searchAddon);
    term.loadAddon(weblinkAddon);

    getLogStr().then((res) => {
      term.write(res?.content || '');
    })
    // 初始化
    // term._initialized = true
    // term.prompt()
    // term.focus()

    return () => {
      console.log('term dispose')
      term.dispose()
    }
  }, []);

  useEffect(() => {
    if(realtimeRefresh) {
      const timer = setInterval(() => {
        refresh()
      }, 5000)
      return () => {
        console.log('清除定时器')
        clearInterval(timer)
      }
    }
  }, [realtimeRefresh])

  const refresh = (str?: string) => {
    getLogStr(str).then((res) => {
      term.reset()
      term.write(res?.content || '', () => {
        console.log('设置最细内容了')
        message.success('刷新成功', 2)
        term.scrollToBottom()
      });
    })
  }

  return (
    <div>
      <div style={{margin: '12px 0'}}>
        <Form
          layout={'inline'}
          form={form}
          onFinish={(values) => {
            if(values.searchValue) {
              refresh(values.searchValue)
              // searchAddon.findNext(values.searchValue)
            }
          }}
        >
          <Form.Item label="搜索内容" name="searchValue">
            <Input placeholder="搜索内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
        <div style={{ margin: '8px 0' }}>
          {/* <Switch onChange={(e) => {
            console.log('neirong', e)
            setRealtimeRefresh(e)
          }} checkedChildren="关闭刷新" unCheckedChildren="开启实时刷新" /> */}
          <Button type={'link'} onClick={() => {
            message.info('刷新中...', 2)
            refresh()
          }}>立即刷新</Button>
        </div>
      </div>
      <div>
        <div id="ter" />
      </div>
    </div>
  );
}
