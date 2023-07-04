import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Radio, Steps, Button, message } from 'antd';
import axios from 'axios';

import style from './index.less'

const App = () => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [isExistApp, setIsExistApp] = useState(true);
  const [stepOneInfo, setStepOneInfo] = useState<any>({});
  const [existAppList, setExistAppList] = useState([]);


  useEffect(() => {
    axios.get('/paas/api/apps/getLatestAll').then(({ data }) => {
      if(data.code === 1) {
        let list = data?.data?.map((i) => {
          return {
            ...i,
            label: `${i.name}(${i.namespace})`,
            value: i.namespace
          }
        })
        setExistAppList(list)
      }
    }).catch((err) => {
      console.log(err)
    })
  }, [])

  const _renderAppInfo = () => {
    if(current === 0) {
      if(isExistApp) {
        return (
          <Form.Item
            name="appNamespace" 
            label="关联应用" 
            rules={[{ required: true, message: '请选择已有应用' }]}
          >
            <Select
              placeholder="请选择已有应用"
              onChange={(val) => {
                for(let i=0; i<existAppList.length; i++) {
                  if(existAppList?.[i]?.namespace === val) {
                    setStepOneInfo(existAppList[i])
                    break;
                  }
                }
              }}
              options={existAppList}
            >
            </Select>
          </Form.Item>
        )
      } else {
        return (
          <>
            <Form.Item name='appName' label="应用名称"  rules={[{ required: true, message: '应用名不能为空' }]}>
              <Input placeholder="请输入应用名" />
            </Form.Item>
            <Form.Item name='appIcon' label="应用图标"  rules={[{ required: true, message: '应用图标不能为空' }]}>
              <Input placeholder="请输入icon链接" />
            </Form.Item>
            <Form.Item name='appDescription' label="应用描述"  rules={[{ required: true, message: '应用描述不能为空' }]}>
              <Input.TextArea placeholder="请输入内容" maxLength={30} showCount />
            </Form.Item>
          </>
        )
      }
    } else if(current === 1) {
      return (
        <>
          <Form.Item name='appVersion' label="应用版本"  rules={[{ required: true, message: '应用版本不能为空' }]}>
            <Input placeholder="请输入应用版本" />
          </Form.Item>
          <Form.Item name='appPackageName' label="应用包名"  rules={[{ required: true, message: '应用包名不能为空' }]}>
            <Input placeholder="请输入应用包名，这里的值就是package.json中的name字段" />
          </Form.Item>
          <Form.Item name='appPublishEmail' label="发布者邮箱"  rules={[{ required: true, message: '发布者不能为空' }]}>
            <Input placeholder="请输入发布者邮箱" />
          </Form.Item>
          <Form.Item name='appChangelog' label="更新日志"  rules={[{ required: true, message: '更新日志不能为空' }]}>
            <Input.TextArea placeholder="请输入更新日志" maxLength={30} showCount />
          </Form.Item>
        </>
      )
    }
  }

  const _pathVersionIncrease = (version) => {
    const parts = version.split(".");
    let major = parseInt(parts[0] || 0);
    let minor = parseInt(parts[1] || 0);
    let patch = parseInt(parts[2] || 0);
    return `${major}.${minor}.${patch + 1}`;
  }

  const registerApp = () => {
    const allValues = form.getFieldsValue()
    let info;
    if(isExistApp) {
      // 已有应用
      info = {
        name: stepOneInfo?.name,
        namespace: stepOneInfo?.namespace,
        icon: stepOneInfo?.icon,
        description: stepOneInfo?.description,
        install_info: JSON.stringify({
          pkgName: allValues.appPackageName,
          changeLog: allValues.appChangelog,
        }),
        version: allValues.appVersion,
        creator_name: allValues.appPublishEmail,
      }
    } else {
      // 新应用
      info = {
        name: stepOneInfo?.appName,
        namespace: allValues?.appPackageName,
        icon: stepOneInfo?.appIcon,
        description: stepOneInfo?.appDescription,
        install_info: JSON.stringify({
          pkgName: allValues.appPackageName,
          changeLog: allValues.appChangelog,
        }),
        version: allValues.appVersion,
        creator_name: allValues.appPublishEmail,
      }
    }
    axios.post('/paas/api/apps/register', info).then(({ data }) => {
      if(data.code === 1) {
        message.info(data?.msg || '注册成功')
      } else {
        message.error('网络错误，请稍后重试')
      }
    }).catch((err) => {
    })
  }

  const _renderAction = () => {
    if(current === 0) {
      return (
        <div className={style.action_wrapper}>
          <Button type="primary" onClick={() => {
            // 新应用
            if(isExistApp === false) {
              form.validateFields().then((values) => {
                setStepOneInfo({...stepOneInfo, ...values})
                setCurrent(1)
              }).catch((errorInfo) => {
                console.log(errorInfo)
              })
            } else {
              // 已有应用
              setCurrent(1)
              setTimeout(() => {
                // 填充默认表单
                form.setFieldValue('appVersion', _pathVersionIncrease(stepOneInfo?.version))
                form.setFieldValue('appPackageName', stepOneInfo?.namespace)
                form.setFieldValue('appPublishEmail', stepOneInfo?.creatorName)
                form.setFieldValue('appChangelog', '修复若干 bug')
              }, 50)
            }
          }}>下一步</Button>
        </div>
      )
    } else {
      return (
        <div className={style.action_wrapper}>
          <Button 
            type="default" 
            style={{marginRight: 12}} 
            onClick={() => {
              setCurrent(0)
            }}
          >
            上一步
          </Button>
          <Button type="primary" onClick={registerApp}>提交</Button>
        </div>
      )
    }
  }

  return (
    <div className={style.register_container}>
      <h2>应用注册</h2>
      <div className={style.step_wrapper}>
        <Steps
          current={current}
          onChange={(value) => {
            setCurrent(value);
          }}
          items={[
            {
              title: '应用信息',
              description: '注册/关联',
              disabled: true,
            },
            {
              title: '版本信息',
              description: '应用版本详细信息',
              disabled: true,
            },
          ]}
        />
      </div>
      <div className={style.form_wrapper}>
        <Form
          layout={'horizontal'}
          form={form}
        >
          {
            current === 0 ? (
              <Form.Item label="是否新应用" name="isNewApp" required>
                <Radio.Group 
                  defaultValue={true} 
                  onChange={(e) => {
                    setIsExistApp(e.target.value)
                  }}
                >
                  <Radio value={true}>已有应用</Radio>
                  <Radio value={false}>新应用</Radio>
                </Radio.Group>
              </Form.Item>
            ) : null
          }
          {_renderAppInfo()}
          {_renderAction()}
        </Form>
      </div>
    </div>
  );
};

export default App;