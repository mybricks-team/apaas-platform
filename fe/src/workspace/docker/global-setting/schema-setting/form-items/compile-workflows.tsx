import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, message, Modal, Card, Empty, Form, Select, Input } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { FileService, VersionService } from './services'

import styles from './compile-workflows.less';

interface Values {
  name: string;
  description?: string;
}

interface CreateFormProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
}

const CreateForm: React.FC<CreateFormProps> = ({
  open,
  onCreate,
  onCancel,
}) => {
  const [form] = Form.useForm();
  return (
    <Modal
      className='fangzhou-theme'
      open={open}
      title="创建"
      okText="确认"
      cancelText="取消"
      onCancel={onCancel}
      mask={false}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        // layout="vertical"
        name="form_in_modal"
      >
        <Form.Item
          name="name"
          label="名称"
          extra="名称一旦创建无法修改，会展示在发布的按钮和版本管理的筛选项中，尽量使用语义化的名称"
          rules={[{ required: true, message: '请填写环境名称' }]}
        >
          <Input placeholder='用中文和英文表示，比如日常环境，线上环境' />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ({ title = '发布环境', name, form, value }) => {
  const [envFormVisible, setEnvFormVisible] = useState<boolean>(false)
  const [files, setFiles] = useState([])
  const [versionMap, setVersionMap] = useState({})

  useEffect(() => {
    FileService.getSysTemFiles({ extName: 'workflow' }).then((files) => {
      setFiles(files)
    })
  }, [])

  const getVersionByFileId = useCallback((fileId) => {
    VersionService.getPublishVersions({ fileId }).then((files) => {
      setVersionMap((c) => ({ ...c, [fileId]: files }))
    })
  }, [])

  const openTask = useCallback((fileId) => {
    window.open(`/mybricks-app-workflow/index.html?id=${fileId}`)
  }, [])

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div className={styles.envs}>
          <div className={styles.title}>
            {`${title}管理`}
            <Button
              type="link"
              onClick={() => setEnvFormVisible(true)}
              block
              style={{ width: 150 }}
              icon={<PlusOutlined />}
            >
              {`新增${title}`}
            </Button>
          </div>
          {fields.map((field) => (
            <Card
              className={styles.envCard}
              key={field.key}
              actions={[
                // <EditOutlined key="setting" />
                <div
                  key="edit"
                  onClick={() => {
                    if (!value[field.name]?.fileId) {
                      message.warn('请先选择任务')
                      return
                    }
                    openTask(value[field.name]?.fileId)
                  }}
                >
                  <EditOutlined />
                  <span style={{ marginLeft: 5 }}>编排任务</span>
                </div>,
                <div
                  key="delete"
                  onClick={() => {
                    Modal.confirm({
                      title: `删除任务「${value?.[field.name]?.name}」`,
                      content:
                        '删除任务后搭建应用将无法发布页面到此环境，请谨慎操作!',
                      okText: '我已知晓，确认删除',
                      cancelText: '取消',
                      onOk: () => remove(field.name),
                      mask: false,
                      className: 'fangzhou-theme'
                    })
                  }}
                >
                  <DeleteOutlined />
                  <span style={{ marginLeft: 5 }}>删除</span>
                </div>,
              ]}
            >
              <Card.Meta
                title={value?.[field.name]?.name}
                description={`${value?.[field.name]?.name}${title}`}
              />
              <Form.Item
                {...field}
                label="任务"
                name={[field.name, 'fileId']}
                style={{ marginTop: 20 }}
                rules={[{ required: true, message: '请填写任务' }]}
                // validateTrigger={['onBlur', 'onChange']}
              >
                <Select
                  showSearch
                  filterOption={(input = '', option) => {
                    const _label = (
                      typeof option?.label === 'string' ? option?.label : ''
                    ).toLowerCase()
                    const _value = (
                      typeof option?.value === 'string' ? option?.value : ''
                    ).toLowerCase()
                    const _input = input.toLowerCase()
                    return _label.includes(_input) || _value.includes(_input)
                  }}
                  options={files.map((file) => ({
                    label: file?.name,
                    value: file?.id,
                  }))}
                  onChange={(fileId) => {
                    form.setFieldValue(
                      [name, field.name, 'version'],
                      ''
                    )
                    getVersionByFileId(fileId)
                  }}
                />
              </Form.Item>
              <Form.Item
                {...field}
                label="版本"
                name={[field.name, 'version']}
                rules={[{ required: true, message: '请填写版本' }]}
                // validateTrigger={['onBlur', 'onChange']}
              >
                <Select
                  options={versionMap?.[value?.[field.name]?.fileId]?.map(
                    (version) => {
                      return {
                        label: version?.version,
                        value: version?.version,
                      }
                    }
                  )}
                  notFoundContent={
                    '当前任务无发布版本，请先点击下方编排按钮去发布'
                  }
                />
              </Form.Item>
            </Card>
            // <Space key={field.key} align="baseline">

            // <MinusCircleOutlined onClick={() => remove(field.name)} />
            // </Space>
          ))}
          <CreateForm
            open={envFormVisible}
            onCreate={({ name }) => {
              const hasRepeatName = (value || []).some(
                (item) => item.name === name
              )
              if (hasRepeatName) {
                message.warn(`名称「${name}」已被使用，请重新取名`)
                return
              }
              add?.({ name })
              setEnvFormVisible(false)
            }}
            onCancel={() => setEnvFormVisible(false)}
          />
        </div>
      )}
    </Form.List>
  )
}
