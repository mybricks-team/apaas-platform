export const folderExtnames = ['folder', 'folder-project', 'folder-module']

export default class Ctx {
  user: { id, name, email }

  parentId: string | null

  popCreate: boolean

  folderExtName: null | string | undefined = undefined

  path: Array<{ id: null | number, name: string, parentId: null | number, groupId: null | number, extName: null | string }> = []


  projectList: null | Array<any> = null

  /**
   * @param pushState 是否操作路由
   */
  getAll: (any) => void;

  /**
   * @param id 文件夹Id
   * @param pushState 是否操作路由
   */
  setPath: (any) => void;

  showCreatePanel() {
    this.popCreate = true
  }

  hideCreatePanel() {
    this.popCreate = false
  }
}
