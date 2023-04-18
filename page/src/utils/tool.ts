/** 文件列表排序 */
export function fileSort(files) {
  /** 参与排序替换位置，数字越大越靠前 */
  const orderMap = {
    'folder': 3,
    'folder-project': 2,
    'folder-module': 1
  }
  return files.sort((c, s) => {
    const cNum = orderMap[c.extName] || -1
    const sNum = orderMap[s.extName] || -1

    return sNum - cNum
  })
}