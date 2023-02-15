// export default class Ctx {
//   user: { id, name }

//   popCreate: boolean

//   path: Array<{ id: null | number, name: string, parentId: null | number }>;

//   projectList: null | Array<any>;

//   /**
//    * @param pushState 是否操作路由
//    */
//   getAll: (pushState?: boolean) => void;

//   /**
//    * @param id 文件夹Id
//    * @param pushState 是否操作路由
//    */
//   setPath: (id: number | string | null, pushState?: boolean) => void;

//   showCreatePanel() {
//     this.popCreate = true
//   }

//   hideCreatePanel() {
//     this.popCreate = false
//   }
// }


export const folderExtnames = ['folder', 'folder-project', 'folder-module']

export default class Ctx {
  user: { id, name, email }

  parentId: string | null

  popCreate: boolean

  folderExtName: null | string | undefined = undefined

  path: Array<{ id: null | number, name: string, parentId: null | number, extName: null | string }> = [{id: null, name: '我的项目', parentId: null, extName: null}]

  projectList: null | Array<any> = null

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

// user,
// path: [{id: null, name: '我的项目', parentId: null}],
// projectList: null,
// getAll(pushState = false) {
//   const parentId = ctx.path[ctx.path.length - 1].id;

//   if (pushState) {
//     // wsCtx.setUrlQuery('id', parentId);
//   }

//   axios({
//     method: "get",
//     url: getApiUrl('/api/workspace/getAll'),
//     params: {userId: user.email, parentId}
//   }).then(({data}) => {
//     if (data.code === 1) {
//       const folderAry: any = [];
//       const fileAry: any = [];

//       data.data.forEach((item) => {
//         const {extName} = item;
//         if (extName === 'folder') {
//           folderAry.push(item);
//         } else {
//           fileAry.push(item);
//         }
//       });

//       ctx.projectList = folderAry.concat(fileAry);
//     } else {
//       message.error(`获取数据发生错误：${data.message}`);
//       ctx.projectList = [];
//     }
//   }).catch(ex => {
//     message.error(`获取数据发生错误：${ex.message}`);
//     ctx.projectList = [];
//   });
// },
// setPath(id: string | null, pushState = false) {
//   ctx.projectList = null;
//   const path = ctx.path.slice(0, 1);

//   if (!id) {
//     ctx.path = path;
//     ctx.getAll(pushState);
//   } else {
//     axios({
//       method: "get",
//       url: getApiUrl('/api/workspace/getFilePath'),
//       params: {userId: user.email, fileId: id}
//     }).then((res) => {
//       const {code, data} = res.data;
//       if (code === 1) {
//         if (data.length) {
//           path.push(...data);
//         }
//       } else {
//         message.error(`获取数据发生错误：${data.message}`);
//       }
//       ctx.path = path;
//     }).catch(ex => {
//       message.error(`获取数据发生错误：${ex.message}`);
//       ctx.path = path;
//     }).finally(() => {
//       ctx.getAll(pushState);
//     });
//   }
// }
