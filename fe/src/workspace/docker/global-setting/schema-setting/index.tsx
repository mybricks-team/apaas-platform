import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { Form, Select, Input, Button, message } from 'antd'
import CompileWorkflows from './form-items/compile-workflows'
// import CompileWorkflow from './form-items/compile-workflow'

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

const simpleCopyObject = target => {
  let res = {}
  try {
    res = JSON.parse(JSON.stringify(target ?? {}))
  } catch (error) {
    res = {}
  }
  return res
}

export default ({ initialValues, schema = [], onSubmit, style }: SchemaSettingProps) => {
  const [form] = Form.useForm()

  const compileWorkflowsKeyName = useMemo(() => {
    return schema.find(t => t.type === 'compileWorkflows')?.id || '';
  }, [schema])

  useEffect(() => {
    if (!!!compileWorkflowsKeyName) {
      form?.setFieldsValue?.(initialValues)
      return
    }
    const newValues = simpleCopyObject(initialValues)
    newValues[compileWorkflowsKeyName] = Object.keys(initialValues?.[compileWorkflowsKeyName] ?? {}).map((keyName) => {
      return {
        name: decodeURI(keyName),
        ...(initialValues?.[compileWorkflowsKeyName]?.[keyName] ?? {}),
      }
    })
    form?.setFieldsValue?.(newValues)
  }, [initialValues, compileWorkflowsKeyName])

  const handleSubmit = useCallback(() => {
    form?.validateFields().then((values) => {
      const newVals = simpleCopyObject(values);
      if (newVals?.[compileWorkflowsKeyName]) {
        const oldArray = JSON.parse(JSON.stringify(newVals[compileWorkflowsKeyName])) 
        delete newVals[compileWorkflowsKeyName]
        oldArray.forEach((env, index) => {
          const { name, ...others } = env
          if (!newVals[compileWorkflowsKeyName]) {
            newVals[compileWorkflowsKeyName] = {}
          }
          newVals[compileWorkflowsKeyName][encodeURI(name)] = { ...others, index }
        })
      }
      typeof onSubmit === 'function' && onSubmit(newVals)
    })
  }, [onSubmit, compileWorkflowsKeyName])

  /** TODO临时代码，这里只能单例了 */
  const compileWorkflowsValue = Form.useWatch(compileWorkflowsKeyName, form) || [];

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
            switch (true) {
              case setting.type === 'input': {
                return (
                  <Form.Item
                    label={setting.title}
                    name={setting.id}
                    required={setting.required}
                    rules={setting.required ? [{ required: true, message: `请设置${setting.title}` }] : []}
                  >
                    <Input {...(setting?.props ?? {})} />
                  </Form.Item>
                )
              }
              case setting.type === 'select': {
                return (
                  <Form.Item
                    label={setting.title}
                    name={setting.id}
                    required={setting.required}
                    rules={setting.required ? [{ required: true, message: `请设置${setting.title}` }] : []}
                  >
                    <Select {...(setting?.props ?? {})} />
                  </Form.Item>
                )
              }
            }            
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
