import css from "./App.less";
import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { message, Typography } from "antd";
import { GoBack } from "./Icons";
import { copyText, getApiUrl, getCookie, getQueryString } from "../utils";

import axios from "axios";
import { useComputed, useObservable } from "@mybricks/rxui";
import {ComlibEditUrl, COOKIE_LOGIN_USER} from "../constants";
import { compile } from "./compile"
import servicePlugin, { call as callConnectorHttp } from "@mybricks/plugin-connector-http";
import versionPlugin from "./../plugins/version-manager";
import {defaultStyle} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import SyntaxHighlighter from 'react-syntax-highlighter';

import * as htmlToImage from 'html-to-image';
import { View } from '@mybricks/sdk-for-app/src/ui';

const LoadingOutlined = window['icons'].LoadingOutlined;
const Title = Typography.Title;
enum SchemaType {
	NUMBER = 'number',
	STRING = 'string',
	BOOLEAN = 'boolean',
	OBJECT = 'object',
	ARRAY = 'array',
}
/** mock 输入输出的数据描述 */
const formatSchema = (schema: any) => {
	if (schema.type === SchemaType.NUMBER) {
		return Math.random();
	} else if (schema.type === SchemaType.STRING) {
		return String(1 - Math.random());
	} else if (schema.type === SchemaType.BOOLEAN) {
		return Math.random() > 0.5;
	} else if (schema.type === SchemaType.OBJECT) {
		return Object.keys(schema.properties).reduce((pre, key) => {
			return { ...pre, [key]: formatSchema(schema.properties[key]) };
		}, {});
	} else if (schema.type === SchemaType.ARRAY) {
		return [formatSchema(schema.items)];
	}
};
/** 适配 react 语法 */
export const formatReactTemplate = (schema: any) => {
	const mock = formatSchema(schema);
	
	if (schema.type === SchemaType.NUMBER) {
		return `{${mock}}`;
	} else if (schema.type === SchemaType.STRING) {
		return `"${mock}"`;
	} else if (schema.type === SchemaType.BOOLEAN) {
		return `{${mock}}`;
	} else if (schema.type === SchemaType.OBJECT) {
		return `{${JSON.stringify(formatSchema(schema))}}`;
	} else if (schema.type === SchemaType.ARRAY) {
		return `{${JSON.stringify(formatSchema(schema))}}`;
	}
};
/** 适配 vue 语法 */
export const formatVueTemplate = (schema: any) => {
	const mock = formatSchema(schema);
	
	if (schema.type === SchemaType.NUMBER) {
		return `"${mock}"`;
	} else if (schema.type === SchemaType.STRING) {
		return `"'${mock}'"`;
	} else if (schema.type === SchemaType.BOOLEAN) {
		return `"${mock}"`;
	} else if (schema.type === SchemaType.OBJECT) {
		return `"${JSON.stringify(formatSchema(schema)).replace(/"/g, "'")}"`;
	} else if (schema.type === SchemaType.ARRAY) {
		return `"${JSON.stringify(formatSchema(schema)).replace(/"/g, "'")}"`;
	}
};

class Ctx {
  user

  fileId

  fileItem

  setContent(content, skipMessage) {
    this.save({ content }, skipMessage)
  }

  setName(name) {
    this.fileItem.name = name
    this.save({ name })
  }

  setNamespace(namespace) {
    this.fileItem.namespace = namespace
    this.save({ namespace })
  }

  setPreviewImg(geoView) {
    return new Promise((resolve, reject) => {
      if (geoView) {
        setTimeout(v => {
          const dom = geoView.canvasDom as HTMLDivElement
          const div = document.createElement('div')
          div.style.width = 'fit-content'
          div.appendChild(dom)

          document.body.append(div)

          htmlToImage.toPng(dom).then((base64) => {
            resolve(base64);
          }).catch(ex => {
            console.error(ex)
            reject(ex);
          }).finally(() => {
            document.body.removeChild(div)
          })
        })
      }
    })

  }

  share(shareType) {
    this.fileItem.shareType = shareType
    this.save({ shareType })
  }

  save({ name, shareType, content, icon, namespace }: { name?, shareType?, content?, icon?, namespace? }, skipMessage?: boolean) {
    if (this.user && this.user.email === this.fileItem?.creatorId) {
      // axios({
      //   method: "post",
      //   url: getApiUrl('/api/workspace/saveFile'),
      //   data: {
      //     userId: ctx.user?.email,
      //     fileId: ctx.fileId,
      //     name,
      //     shareType,
      //     content,
      //     namespace,
      //     icon
      //   }
      // }).then(({ data }) => {
      //   if (skipMessage) {
      //     return;
      //   }

      //   if (data.code === 1) {
      //     message.info(`保存完成`)
      //   } else {
      //     message.error(`保存失败：${data.message}`)
      //   }
      // })
      this.sdkSave({
        userId: ctx.user?.email,
        fileId: ctx.fileId,
        name,
        shareType,
        content,
        namespace,
        icon
      }, {skipMessage})
    }
  }

  publish(com) {
    if (this.user && this.user.email === this.fileItem?.creatorId) {
      let type = this.fileItem.type;

      if (typeof type === 'string' && type) {
        type = type.split("-")[1];
      }
      

      return new Promise((resolve) => {
        this.sdkPublish({
          email: this.user.email,
          type,
          ...com,
          content: ''
        }).then(() => {
          resolve()
        })
      })

      // return axios({
      //   method: "post",
      //   url: getApiUrl('/api/material/component/create'),
      //   data: {
      //     email: this.user.email,
      //     type,
      //     ...com
      //   }
      // }).then(({ data }) => {
      //   if (data.code === 1) {
      //     message.info(`发布完成(版本号:${com.version})`)
      //   } else {
      //     message.error(`发布失败：${data.message}`)
      //   }
      // })
    }

    return Promise.reject('用户信息不存在');
  }
}

let ctx: Ctx

export default function App() {
  const [D, setD] = useState();
  const [beforeunload, setBeforeunload] = useState(false);
  const [pageStatus, setPageStatus] = useState("desn");

  const sdk = useRef<any>(null);

  ctx = useObservable(Ctx, next => {
    next({});
  });

  useEffect(() => {
    if (beforeunload) {
      window.onbeforeunload = () => { return true; };
    } else {
      window.onbeforeunload = null;
    }
  }, [beforeunload]);

  const onEdit = useCallback(() => {
    setBeforeunload(true);
  }, [setBeforeunload]);

  const getPubData = useCallback((namespace: string) => {
    axios({
      method: "get",
      url: getApiUrl('/material/api/material/namespace/content'),
      params: { userId: ctx.user?.email, namespace }
    }).then(res => {
      if (res.data.code === 1) {
        ctx.fileItem.pubData = res.data.data;
      }
    })
  }, [])

  const designerRef = useRef<{ dump, toJSON, geoView }>()

  const save = useCallback((skipMessage) => {//保存
    const json = designerRef.current?.dump();
    ctx.setContent(JSON.stringify(json), typeof skipMessage === 'boolean' ? skipMessage : false);
    setBeforeunload(false);

    ctx.setPreviewImg(designerRef.current?.geoView).then((icon) => {
      ctx.save({
        icon: icon
      }, true);
    }).catch(err => {
      console.error(err);
    });

  }, [setBeforeunload])

  const publish = useCallback(() => {
    const { name, namespace } = ctx.fileItem;

    if (namespace === "_self" || !namespace) {
      message.info("请修改namespace");
      return;
    }

    setPageStatus("publish");

    save(true);

    axios({
      method: "get",
      url: getApiUrl('/material/api/material/namespace/content'),
      params: { namespace }
    }).then(({ data }) => {
      compile({title: name, namespace, version: undefined }, designerRef.current?.toJSON()).then(com => {
        ctx.publish(com).then(() => getPubData(namespace)).finally(() => {
          setPageStatus("desn");
        });
      })
    }).catch(e => {
      compile({title: name, namespace, version: undefined }, designerRef.current?.toJSON()).then(com => {
        ctx.publish(com).then(() => getPubData(namespace)).finally(() => {
          setPageStatus("desn");
        });
      })
    })
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, [])

  useComputed(() => {
    if (ctx.fileItem) {
      import('@mybricks/designer').then(Designer => {
        setD(Designer.default as any)
      })
    }
  })

  /** 使用 function 处理 ref，能监听 ref 变化 */
	const handleRefChange = useCallback(ref => {
		if (ref && ref.fileContent) {
			sdk.current = ref;

      ctx.user = ref.user;
      ctx.fileId = ref.fileId;
      ctx.fileItem = ref?.fileContent || {};
      
      ctx.sdkSave = ref.save;
      ctx.sdkPublish = ref.publish;
		}
	}, []);


  return (
    <View ref={handleRefChange} extName='cloud-com'>
      <div className={css.view}>
        <div className={css.toolbar}>
          <div className={css.icon} onClick={goBack}>
            {GoBack}
          </div>
          <div className={css.projectName}
            style={{ marginRight: 'auto' }}>{ctx.fileItem?.name}</div>
          {
            (ctx.user && ctx.user.email === ctx.fileItem?.creatorId) ? (
              <>
                <button className={css.primary} onClick={save}>保存</button>
                <button onClick={publish} disabled={pageStatus !== 'desn'}>
                  {pageStatus !== 'desn' ? (
                    <>
                      <LoadingOutlined />
                      发布中
                    </>
                  ) : "发布"}
                </button>
              </>
            ) : null
          }
        </div>
        <div className={css.designer}>
          {
            D ? (
              // @ts-ignore
              <D config={config(ctx)} ref={designerRef} onEdit={onEdit} />
            )
              : (
                <div className={css.loading}>加载中...</div>
              )
          }

        </div>
      </div>
    </View>
  )
}

const config = (ctx) => {
  return {
    plugins: [
      servicePlugin(),
      versionPlugin({
        file: ctx.fileItem,
        disabled: ctx.disabled,
        onInit: (versionApi) => {
          ctx.versionApi = versionApi
        }
      })
    ],
    comLibLoader(desc) {//加载组件库
      return new Promise((resolve, reject) => {
        resolve([ComlibEditUrl])
      })
    },
    pageContentLoader() {//加载页面内容
      return new Promise((resolve, reject) => {
        resolve(ctx.fileItem.content)
      })
    },
    editView: {
      items({ }, cate0, cate1, cate2) {
        cate0.title = `实例项目`
        cate0.items = [
          {
            title: '名称',
            type: 'Text',
            //options: {readOnly: true},
            value: {
              get: (context) => {
                return ctx.fileItem.name
              },
              set: (context, v: any) => {
                ctx.setName(v)
              }
            }
          },
          {
            title: '发布配置',
            items: [
              {
                title: '命名空间',
                type: 'Text',
                description: '组件唯一标识',
                options: {readOnly: true},
                value: {
                  get: (context) => {
                    return ctx.fileItem.namespace
                  },
                  set: (context, v: any) => {
                    // ctx.setNamespace(v)
                  }
                }
              }
            ]
          },
          {
            title: '分享到案例库',
            type: 'switch',
            //options: {readOnly: true},
            value: {
              get: (context) => {
                return ctx.fileItem.shareType
              },
              set: (context, v: any) => {
                ctx.share(v)
              }
            }
          },
          () => {
  
            const Render = useComputed(() => {
              const { type, pubData } = ctx.fileItem;
  
              let jsx = <></>
  
              if (pubData) {
                const [, cdmType] = type.split('-');
                const { namespace } = pubData;
                const npmString = `npm i @mybricks-cloud/${namespace}`;
                const codeString = cdmType.toUpperCase() === 'REACT' ? reactStr(pubData) : vueStr(pubData);
  
                jsx = (
                  <div className={css.materialGuide}>
                    <Title level={4}>NPM 包安装</Title>
                    <div className={css.code}>
                      <SyntaxHighlighter language="javascript" style={defaultStyle}>
                        {npmString}
                      </SyntaxHighlighter>
                      <svg
                        onClick={() => {
                          if (copyText(npmString)) {
                            message.success('复制成功');
                          }
                        }}
                        className={css.copy}
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                      >
                        <path
                          d="M768 682.666667V170.666667a85.333333 85.333333 0 0 0-85.333333-85.333334H170.666667a85.333333 85.333333 0 0 0-85.333334 85.333334v512a85.333333 85.333333 0 0 0 85.333334 85.333333h512a85.333333 85.333333 0 0 0 85.333333-85.333333zM170.666667 170.666667h512v512H170.666667z m682.666666 85.333333v512a85.333333 85.333333 0 0 1-85.333333 85.333333H256a85.333333 85.333333 0 0 0 85.333333 85.333334h426.666667a170.666667 170.666667 0 0 0 170.666667-170.666667V341.333333a85.333333 85.333333 0 0 0-85.333334-85.333333z"></path>
                      </svg>
                    </div>
                    <Title level={4}>使用</Title>
                    <div className={css.code}>
                      <SyntaxHighlighter language="javascript" style={defaultStyle}>
                        {codeString}
                      </SyntaxHighlighter>
                      <svg
                        onClick={() => {
                          if (copyText(codeString)) {
                            message.success('复制成功');
                          }
                        }}
                        className={css.copy}
                        viewBox="0 0 1024 1024"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                      >
                        <path
                          d="M768 682.666667V170.666667a85.333333 85.333333 0 0 0-85.333333-85.333334H170.666667a85.333333 85.333333 0 0 0-85.333334 85.333334v512a85.333333 85.333333 0 0 0 85.333334 85.333333h512a85.333333 85.333333 0 0 0 85.333333-85.333333zM170.666667 170.666667h512v512H170.666667z m682.666666 85.333333v512a85.333333 85.333333 0 0 1-85.333333 85.333333H256a85.333333 85.333333 0 0 0 85.333333 85.333334h426.666667a170.666667 170.666667 0 0 0 170.666667-170.666667V341.333333a85.333333 85.333333 0 0 0-85.333334-85.333333z"></path>
                      </svg>
                    </div>
                    {/* <MaterialGuide content={pubData} /> */}
                  </div>
                )
              } else {
  
              }
  
              return jsx
            })
  
            return Render
          }
        ]
      }
    },
    toplView: {
      title: '交互',
      cards: {
        main: {
          title: '组件',
          ioEditable: true
        }
      }
    },
    com: {
      env: {
        i18n(title) {//多语言
          return title
        },
        callConnector(connector, params) {//调用连接器
          if (connector.type === 'http') {//服务接口类型
            return callConnectorHttp({ script: connector.script, params })
          } else {
            return Promise.reject('错误的连接器类型.')
          }
        },
      },
      events: [//配置事件
        {
          type: 'jump',
          title: '跳转到',
          exe({ options }) {
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
}

function getNextVersion(version, max = 100) {
  if (!version) return '1.0.0';
  const vAry: any[] = version.split('.')
  let carry: boolean = false
  const isMaster = vAry.length === 3;
  if (!isMaster) {
    max = -1;
  }

  for (let i = vAry.length - 1; i >=0; i--) {
    const res: number = Number(vAry[i]) + 1
    if (i === 0) {
      vAry[i] = res
    } else {
      if (res === max) {
        vAry[i] = 0  
        carry = true
      } else {
        vAry[i] = res
        carry = false
      }
    }
    if (!carry) break
  }

  return  vAry.join('.')
}

function reactStr (content) {
  let string = content
			? `import CloudComponent from "@mybricks-cloud/${content?.namespace}";\n \n<CloudComponent--place--/>`
			: '';
		let place = '';

		const inputs = content?.inputs || [];
		const outputs = content?.outputs || [];
		if (inputs.length || outputs.length) {
			place += '\n';
		} else {
			place += ' ';
		}
		inputs?.forEach(input => {
			place += `  ${input.id}=${formatReactTemplate(input.schema)}\n`
		});
		outputs?.forEach(output => {
			place += `  ${output.id}={() => console.log('执行事件 ${output.id}')}\n`
		});

		return string.replace('--place--', place);
}

function vueStr (content) {
  let string = content
			? `import CloudComponent from "@mybricks-cloud/${content?.namespace}";\n \n<cloud-component--place--/>`
			: '';
		let place = '';

		const inputs = content?.inputs || [];
		const outputs = content?.outputs || [];
		if (inputs.length || outputs.length) {
			place += '\n';
		} else {
			place += ' ';
		}
		inputs?.forEach(input => {
			place += `  :${input.id}=${formatVueTemplate(input.schema)}\n`
		});
		outputs?.forEach(output => {
      const { id } = output;
			place += `  @${id}="() => {/** 执行事件 ${id} */}"\n`
		});

		return string.replace('--place--', place);
}
