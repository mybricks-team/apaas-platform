import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'

function TemplateChooseModal(props) {
  const { hasInstalledMaterial, extName, templateGuideType, onChoose, onCancel, onOk, modalVisible } = props
  const [templateList, setTemplateList] = useState([])
  const [currentHoverIndex, setCurrentHoverIndex] = useState(27981)
  useEffect(() => {
    if(hasInstalledMaterial) {
      axios.get('/api/material/template/list', {
        params: {
          extName: extName,
          templateGuideType: templateGuideType
        }
      }).then(({ data }) => {
        if(data.code === 1) {
          setTemplateList(data.data)
        }
      }).catch(() => {

      })
    }
  }, [])

  const renderNope = () => {
    return (
      <div>
        <p style={{textAlign: 'center'}}>当前环境未安装物料市场</p>
      </div>
    )
  }

  const renderContent = () => {

    return (
      <div style={{height: 716, overflow:'scroll'}}>
        {
          templateList?.map((item, i) => {
            return (
              <div style={{marginBottom: '20px'}}>
                <p style={{fontWeight: 800, fontSize: 16, display: 'block'}}>{i+1} - {item.title}</p>
                <div style={{display: 'flex', flexWrap: 'wrap'}}>
                  {item?.templates?.map((template, index) => {
                    return (
                      <div
                        style={{
                          boxSizing: 'border-box',
                          position: 'relative',
                          cursor: 'pointer',
                          width: 208,
                          height: 221,
                          boxShadow: '0px 3px 5px 0px #1f23290a',
                          borderRadius: 5,
                          border: '1px solid #ebedf0',
                          marginBottom: 20,
                          marginRight: 10
                        }} 
                        data-fileid={template.file_id} 
                        onMouseEnter={(e) => {
                          const id = e.currentTarget.dataset.fileid;
                          setCurrentHoverIndex(+id)

                        }}
                        onMouseLeave={(e) => {
                          setCurrentHoverIndex(-1)
                        }}
                      >
                        <div style={{padding: 6, height: '191px'}}>
                          <div style={{ height: '100%', backgroundSize: 'cover', backgroundPosition: 'top', backgroundImage: `url(${template.preview_img})` }} />
                        </div>
                        <p style={{textAlign:'center', fontWeight: 800, backgroundColor: '#f8f9fa', lineHeight: '20px', textOverflow: 'ellipsis', padding: 5}}>{template.title}</p>
                        {
                          currentHoverIndex == template.file_id ? 
                              <div 
                                data-fileid={template.file_id}  
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
                                <Button type="primary"
                                  onClick={() => {
                                    onChoose({ fileId: template.file_id, title: template.title })
                                  }}
                                >
                                  使用
                                </Button>
                          </div>
                           : null
                        }
                      </div>  
                    )
                  })}
                </div>
              </div>
            )
          })
        }
      </div>
    )
  }
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
      {hasInstalledMaterial ? renderContent() : renderNope()}
    </Modal>
  )
}

export default TemplateChooseModal