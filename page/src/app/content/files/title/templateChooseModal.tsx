import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'
import { Icon } from '@/app/components';
import { observe } from '@mybricks/rxui';
import AppCtx from '@/app/AppCtx';

const CommonTemplateChooseModal = props => {
  const appCtx = observe(AppCtx, { from: 'parents' });
  const { extName, onChoose, onCancel, onOk, modalVisible } = props;
  const [templateList, setTemplateList] = useState([]);
  const [currentHoverIndex, setCurrentHoverIndex] = useState(-1);
  const { APPSMap } = appCtx;
  const appReg = APPSMap[extName];
  useEffect(() => {
    axios.post('/paas/api/share/getAll', {
      extName: extName,
      page: 0,
      pageSize: 1000
    })
      .then(({ data }) => {
        if(data.code === 1) {
          setTemplateList(data.data?.list ?? [])
        }
      })
  }, []);

  return (
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
      <div style={{maxHeight: 716, overflow: 'auto', display: 'flex', flexFlow: 'wrap'}}>
        {
          templateList?.map(template => {
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
          })
        }
      </div>
    </Modal>
  )
};

export default CommonTemplateChooseModal;