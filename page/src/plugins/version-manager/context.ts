import * as React from 'react'

export const VersionContext = React.createContext({
  openPublishModal: (...args) => {},
  openSaveModal: (...args) => {},
  disabled: false,
  file: {
    extName: '',
  },
  viewNode: {
    current: {}
  }
})
