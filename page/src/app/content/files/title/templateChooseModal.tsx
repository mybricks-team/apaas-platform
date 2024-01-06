import axios from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { Modal, Button } from 'antd'
import { Icon } from '@/app/components';
import { observe } from '@mybricks/rxui';
import AppCtx from '@/app/AppCtx';

const templateTypeStyle = {
  color: "rgba(0,0,0,.85)",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "22px",
  wordWrap: "break-word",
  marginBottom: "12px",
}

let iframeListener

const CommonTemplateChooseModal = props => {
  const iframeRef = useRef();
  const appCtx = observe(AppCtx, { from: 'parents' });
  const { extName, onChoose, onCancel, onOk, modalVisible } = props;
  // const [templateList, setTemplateList] = useState([]);
  const [{staticTemplateList, dynamicTemplateList}, setTemplateList] = useState({staticTemplateList: [], dynamicTemplateList: extName === "pc-page" ? [] : null})
  const [currentHoverIndex, setCurrentHoverIndex] = useState(-1);
  const { APPSMap } = appCtx;
  const appReg = APPSMap[extName];
  useEffect(() => {
    // axios.post('/paas/api/share/getAll', {
    //   extName: extName,
    //   page: 0,
    //   pageSize: 1000
    // })
    //   .then(({ data }) => {
    //     if(data.code === 1) {
    //       setTemplateList(data.data?.list ?? [])
    //     }
    //   })

    // TODO: 临时
    Promise.all([
      new Promise((resolve) => {
        axios.post('/paas/api/share/getAll', {
          extName: extName,
          page: 0,
          pageSize: 1000
        })
          .then(({ data }) => {
            if(data.code === 1) {
              resolve(data.data?.list ?? [])
            }
          })
      }),
      new Promise((resolve) => {
        if (dynamicTemplateList) {
          axios.post('/paas/api/share/getAll', {
            extName: 'pc-template',
            page: 0,
            pageSize: 1000
          })
            .then(({ data }) => {
              if(data.code === 1) {
                resolve(data.data?.list ?? [])
              }
            })
        } else {
          resolve(null)
        }
      })
    ]).then(([staticTemplateList, dynamicTemplateList]) => {
      setTemplateList({
        staticTemplateList,
        dynamicTemplateList
      })
    })
  }, []);
  const [dynamicTemplateModalInfo, setDynamicTemplateModalInfo] = useState(null)

  function handleDynamicTemplateMessage(event) {
    if (event.source === iframeRef.current?.contentWindow) {
      iframeListener = false
      window.removeEventListener('message', handleDynamicTemplateMessage);
      onChoose({dumpJSON: event.data, ...dynamicTemplateModalInfo})
    }
  }

  function renderDynamicTemplateModal() {
    if (!dynamicTemplateModalInfo) {
      if (iframeListener) {
        iframeListener = false
        window.removeEventListener('message', handleDynamicTemplateMessage);
      }
      return null
    }

    if (!iframeListener) {
      iframeListener = true
      window.addEventListener('message', handleDynamicTemplateMessage);
    }

    return (
      <Modal
        open={true}
        title={"基于动态模板创建"}
        destroyOnClose
        width={942}
        onCancel={() => setDynamicTemplateModalInfo(null)}
        footer={null}
        mask={false}
      >
        <div style={{height: 769}}>
          <iframe
            ref={iframeRef}
            style={{width: '100%', height: '100%', border: 'none'}}
            src={`/mfs/files/${dynamicTemplateModalInfo.fileId}/publish.html`}
          />
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Modal
        open={modalVisible}
        title="模板选择"
        destroyOnClose
        width={942}
        onOk={onOk}
        onCancel={onCancel}
        cancelText="取消"
        okText="选择空模板"
      >
        {/* display: 'flex', flexFlow: 'wrap' */}
        <div style={{maxHeight: 716, overflow: 'auto'}}>
          {dynamicTemplateList?.length ? <div>
            <div style={templateTypeStyle}>动态模板</div>
            {
              dynamicTemplateList?.map(template => {
                return (
                  <TemplateItem
                    template={template}
                    appReg={appReg}
                    currentHoverIndex={currentHoverIndex}
                    setCurrentHoverIndex={setCurrentHoverIndex}
                    onChoose={(value) => {
                      setDynamicTemplateModalInfo(value)
                    }}
                  />
                )
              })
            }
          </div> : null}
          <div>
            {dynamicTemplateList?.length ? <div style={templateTypeStyle}>静态模板</div> : null}
            {
              staticTemplateList?.map(template => {
                return (
                  <TemplateItem
                    template={template}
                    appReg={appReg}
                    currentHoverIndex={currentHoverIndex}
                    setCurrentHoverIndex={setCurrentHoverIndex}
                    onChoose={onChoose}
                  />
                )
              })
            }
          </div>
        </div>
      </Modal>
      {renderDynamicTemplateModal()}
    </>
  )
};

function TemplateItem ({ template, appReg, currentHoverIndex, setCurrentHoverIndex, onChoose }) {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        position: 'relative',
        cursor: 'pointer',
        width: 208,
        height: 181,
        boxShadow: '0px 3px 5px 0px #1f23290a',
        borderRadius: 5,
        border: '1px solid #ebedf0',
        marginBottom: 20,
        marginRight: 10,
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
      data-fileid={template.id}
      onMouseEnter={(e) => {
        const id = e.currentTarget.dataset.fileid;
        setCurrentHoverIndex(+id)
      }}
      onMouseLeave={(e) => {
        setCurrentHoverIndex(-1)
      }}
    >
      <div
        style={{
          padding: 6,
          height: '140px',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <Icon icon={template.icon || appReg?.icon} width={template.icon ? 140 : 32} height={template.icon ? '100%' : 32}/>
      </div>
      <p
        style={{
          textAlign:'center',
          fontWeight: 800,
          lineHeight: '30px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          padding: 5
      }}>
        {template.name}
      </p>
      {
        currentHoverIndex == template.id ?
          <div
            data-fileid={template.id}
            style={{
              position: 'absolute',
              left: 0, top: 0,
              width: '100%', height: '100%',
              backgroundColor:'#1f232980',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
            }}
          >
            <Button type="primary" onClick={() => onChoose({ fileId: template.id, title: template.name })}>
              使用
            </Button>
          </div>
          : null
      }
    </div>
  )
}

export default CommonTemplateChooseModal;