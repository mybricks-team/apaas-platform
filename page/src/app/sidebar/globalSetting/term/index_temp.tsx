import React, { useState, useRef, useEffect } from "react";
import { XTerm } from "xterm-for-react";
import { SearchAddon } from 'xterm-addon-search'
import { FitAddon } from 'xterm-addon-fit'


import { Form, Radio, Input, Button } from 'antd'
import axios from 'axios'
import { getApiUrl } from "@/utils";

export default function Term() {
  const [form] = Form.useForm();
  const [result, setResult] = useState("Hello world");
  const searchAddon = new SearchAddon()
  const fitAddon = new FitAddon()

  const getLogStr = async () => {
    return new Promise((resolve, reject) => {
      axios.post(getApiUrl('/paas/api/log/search')).then(({ data }) => {
        if(data.code === 1) {
          resolve(data.data)
        }
      })
    })
  }

  useEffect(() => {
    getLogStr().then((res) => {
      termRef.current.terminal.write(res?.content || '');
    })
  }, []);

  
  const termRef = useRef(null);
  return (
    <div>
      <div style={{margin: '12px 0'}}>
        <Form
          layout={'inline'}
          form={form}
          onFinish={(values) => {
            console.log('111', values)
          }}
        >
          <Form.Item label="搜索内容" name="searchValue">
            <Input placeholder="input placeholder" />
          </Form.Item>
          {/* <Form.Item label="Field B">
            <Input placeholder="input placeholder" />
          </Form.Item> */}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
      </div>
      <XTerm
        ref={termRef}
        addons={[searchAddon]}
        onKey={(e) => {
          // console.log(1,e)
        }}
        onData={(data) => {
          // console.log(2,data)
          // const code = data.charCodeAt(0);
          // // If the user hits empty and there is `something` typed echo it.
          // if (code === 13 && input.length > 0) {
          //   termRef.current.terminal.write("\r\nYou typed: '" + input + "'\r\n");
          //   termRef.current.terminal.write("echo> ");
          //   setInput("");
          // } else if (code < 32 || code === 127) {
          //   // Disable control Keys such as arrow keys
          //   return;
          // } else {
          //   // Add general key press characters to the terminal
          //   termRef.current.terminal.write(data);
          //   setInput((prev) => prev + data);
          // }
        }}
      />
    </div>
  );
}
