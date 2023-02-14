export default class Ctx {
  user: { id, name }

  popCreate: boolean

  path: Array<{ id: null | number, name: string, parentId: null | number }>;

  projectList: null | Array<any>;

  /**
   * @param pushState 是否操作路由
   */
  getAll: (pushState?: boolean) => void;

  /**
   * @param id 文件夹Id
   * @param pushState 是否操作路由
   */
  setPath: (id: number | string | null, pushState?: boolean) => void;

  showCreatePanel() {
    this.popCreate = true
  }

  hideCreatePanel() {
    this.popCreate = false
  }
}