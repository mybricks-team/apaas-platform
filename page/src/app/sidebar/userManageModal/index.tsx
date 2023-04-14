import React, { useEffect, useState } from 'react';
import { Select, Form, Input, Button, Table, Col, Row } from 'antd';
import axios from 'axios';
import {getApiUrl} from '../../../utils'
const Option = Select.Option;

const ROLE_MAP = {
  '全部': -1,
  '游客': 1,
  '普通用户': 2,
  '超管': 10
}

export default function UserManageModal() {
  const [formValues, setFormValue] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div>ds</div>
      ),
    },
  ];

  const data = []

  useEffect(() => {
    axios.post(getApiUrl('/paas/api/user/queryByRoleAndName'), {
      ...formValues,
      ...pagination
    }).then((res) => {
      console.log('响应是', res)
    })
  }, [])

  return (
    <div>
      <Form
        style={{  }}
        initialValues={formValues}
        onFinish={(values) => {
          console.log('查询条件是', values)
        }}
        autoComplete="off"
      >
        <Row justify={'space-around'}>
          <Col span={7} offset={1} key={1}>
            <Form.Item
              label="邮箱"
              name="email"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={7} offset={1} key={2}>
            <Form.Item
              name="role"
              label="权限"
            >
              <Select
                placeholder="请选择"
                allowClear
              >
                <Option value={ROLE_MAP.全部}>全部</Option>
                <Option value={ROLE_MAP.游客}>游客</Option>
                <Option value={ROLE_MAP.普通用户}>普通用户</Option>
                <Option value={ROLE_MAP.超管}>超管</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={7} offset={1} key={3}>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table columns={columns} dataSource={data} pagination={{ position: ['bottomRight'] }} />;
    </div>
  )
}