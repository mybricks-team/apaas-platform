import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { Form, Select, Input, Button, message } from 'antd'
import CompileWorkflows from './form-items/compile-workflows'

// @ts-ignore
import styles from './index.less'

export interface SettingItem {
  /** 表单项名称 */
  title: string
  /** 表单项对应的key */
  id: string
  /** 表单项类型 */
  type: 'compileWorkflows' | 'input' | 'select'
  required?: boolean,
  /** 表单项组件对应的props */
  props?: any
}

interface SchemaSettingProps {
  initialValues?: any,
  schema?: SettingItem[],
  onSubmit?: (any) => void
  style: CSSProperties,
}

export default ({ initialValues, schema = [], onSubmit, style }: SchemaSettingProps) => {
  const [form] = Form.useForm()
  useEffect(() => {
    form?.setFieldsValue?.(initialValues)
  }, [initialValues])

  const handleSubmit = useCallback(() => {
    form?.validateFields().then((values) => {
      typeof onSubmit === 'function' && onSubmit(values)
    })
  }, [onSubmit])

  /** TODO临时代码，这里只能单例了 */
  const compileWorkflowsValue = Form.useWatch(schema.find(t => t.type === 'compileWorkflows')?.id || '', form) || [];

  return (
    <div className={styles.schemaSetting} style={style}>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        labelAlign="left"
        autoComplete="off"
        className={styles.form}
      >
        {
          schema.map(setting => {
            if (setting.type === 'compileWorkflows') {
              return <CompileWorkflows title={setting.title} name={setting.id} form={form} value={compileWorkflowsValue} />
            }

            return (
              <Form.Item
                label={setting.title}
                name={setting.id}
                required={setting.required}
                rules={setting.required ? [{ required: true, type: 'string', message: `请设置${setting.title}` }] : []}
              >
                {
                  setting.type === 'input' && <Input {...(setting?.props ?? {})} />
                }
                {
                  setting.type === 'select' && <Select {...(setting?.props ?? {})} />
                }
              </Form.Item>
            )
          })
        }
      </Form>
      <div className={styles.btnGroups}>
        <Button
          size="middle"
          type="primary"
          onClick={handleSubmit}
        >
          保存
        </Button>
      </div>
    </div>
  )
}
