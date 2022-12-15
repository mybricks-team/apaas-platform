import React, { useEffect } from 'react';
import { Form, Select, Input, Button, message } from 'antd'

import styles from './compile-workflows.less';


export default (props) => {
  // const [form] = Form.useForm()

  console.log(props)

  // useEffect(() => {
  //   // form.setFieldsValue(value)
  // }, [value])

  return (
    <div>
      {/* <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onChange={(e) => {
          console.log(e, 'e')
        }}
      >
        <Form.Item
          label={'xxx'}
          name={'xxx'}
          required={true}
          rules={[{ required: true, type: 'string', message: `请设置` }]}
        > */}
          <Input />
        {/* </Form.Item>
      </Form> */}
    </div>
  );
}