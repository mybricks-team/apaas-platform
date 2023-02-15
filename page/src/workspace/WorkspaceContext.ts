import {FC} from 'react';

import AppStore from './app-store';
import {getUrlQuery} from '../utils';

export type APP_MENU_ITEM_ID = "my_project" | "running_task";

/** 菜单栏 */
// export const APP_MENU_ITEMS: Array<{
//   /** 唯一id */
//   id: APP_MENU_ITEM_ID;
//   /** 展示的item名称 */
//   label: string;
//   /** 展示的图标 */
//   Icon: ({ width, height }: {
//     width: any;
//     height: any;
//   }) => JSX.Element

// }> = [
//   {id: 'my_project', label: '我的项目', Icon: IconMyProjects},
//   // {id: 'running_task', label: '运行中的任务', Icon: IconTimedTask}
// ];

/** 默认选中 */
export const APP_DEFAULT_ACTIVE_MENUID = "my_project";

/** 菜单栏列表 */
export const APP_MENU_ITEMS: Array<T_App> = [
  {
    title: "我的项目",
    description: "我的项目",
    type: "my_project",
    namespace: "my_project",
    icon: "https://assets.mybricks.world/icon/myprojects.7cd8f4c7813982aa.png",
  },
  // 暂时注释TODO
  // {
  //   title: '运行中的任务',
  //   description: '运行中的任务',
  //   type: 'running_task',
  //   namespace: 'running_task',
  //   icon: 'https://ali-ec.static.yximgs.com/udata/pkg/eshop/mybricks/myprojects.7cd8f4c7813982aa.png'
  // },
];

export const BOTTOM_APP_MENU_ITEMS: Array<T_App> = [
  {
    title: "应用商店",
    description: "应用商店",
    type: "app-store",
    namespace: "app-store",
    icon: "https://assets.mybricks.world/icon/liuleidashuaige.png",
    Element: AppStore,
    isInlineApp: true,
  },
];

export const APP_MENU_ITEM_MAP = {};

APP_MENU_ITEMS.forEach((item) => {
  APP_MENU_ITEM_MAP[item.namespace] = item;
});

//
export const JOBS_USE_EMAILS = [
  "bitebainiao@metaportdao.eth",
  "stuzhaoxing@gmail.com",
  "15958651599@163.com",
];

/** 用户信息 */
export interface User {
  /** id */
  id: number;
  /** 邮箱账号 */
  email: string;
  /** licenseCode */
  licenseCode: string;
}

interface IAppExport {
  name: string;
  path: string;
  type: string;
}

/** APP */
export interface T_App {
  /** 图标 */
  icon: string;
  /** 应用类型类型: 系统、用户 */
  type: string;
  /** 搭建应用类型 */
  extName: string;
  /** 标题 */
  title: string;
  /** 跳转链接 */
  homepage?: string;
  /** 唯一命名空间 */
  namespace: string;
  /** 描述 */
  description?: string;
  /** 应用版本 */
  version?: string;
  /** 应用设置 */
  setting?: string | any;
  /** 应用导出设置 */
  exports?: IAppExport[];
 
  isInlineApp?: boolean;
  /** 前端使用，inlineApp 渲染 */
  Element?: FC;
}

const queryKeys = ["path", "id"];
const queryKeysMap = {};
queryKeys.forEach((key) => (queryKeysMap[key] = true));

export default class WorkspaceContext {
  /** 侧边栏应用列表 */
  DockerAPPS: Array<T_App> = [];
  /** 搭建应用列表 */
  DesignAPPS: Array<T_App> = [];
  /** 原始应用安装列表(接口请求获取) */
  InstalledAPPS: Array<T_App> = [];
  /** 快速检索App信息 */
  APPSMap: { [key: string]: T_App } = {};
  /** 设置各类应用 */
  setApps(apps: Array<T_App>) {
    /** 平台默认,搭建应用 */
    const DesignAPPS: Array<T_App> = [
      // 平台特殊应用特殊处理
      {
        title: "文件夹",
        description: "文件夹",
        extName: "folder",
        namespace: "mybricks-folder",
        icon: "https://assets.mybricks.world/icon/folder.5782d987cf098ea8.png",
      },
      {
        title: "项目文件夹",
        description: "通过项目的方式管理文件",
        extName: "folder",
        namespace: "folder-project",
        icon: "https://assets.mybricks.world/icon/folder.5782d987cf098ea8.png",
      },
      {
        title: "模块文件夹",
        description: "通过模块的方式管理文件",
        extName: "folder",
        namespace: "folder-module",
        icon: "https://assets.mybricks.world/icon/folder.5782d987cf098ea8.png",
      },
    ];

    /** 平台默认,侧边栏应用 */
    const DockerAPPS: Array<T_App> = [
      {
        title: "大家的分享",
        description: "大家的分享",
        extName: "ground",
        namespace: "ground",
        icon: "https://assets.mybricks.world/icon/leileizi.png"
      },
    ];

    const APPSMap: { [key: string]: T_App } = {};

    DesignAPPS.forEach((app: T_App) => {
      APPSMap[app.namespace] = app;
      APPSMap[app.extName] = app;
    });

    apps.forEach((app: T_App) => {
      /** 根据某个字段去做判断 */
      if (app.namespace === 'mybricks-material') {
        DockerAPPS.push(app);
      } else {
        DesignAPPS.push(app);
      }

      APPSMap[app.namespace] = app;
      APPSMap[app.extName] = app;
    });
    // 侧边栏应用
    this.DockerAPPS = DockerAPPS.filter(app => this.isAdministrator ? true : !this.adminNameSpaces.includes(app.namespace));
    // 搭建应用
    this.DesignAPPS = DesignAPPS.filter(app => this.isAdministrator ? true : !this.adminNameSpaces.includes(app.namespace));
    // 原始安装应用列表
    this.InstalledAPPS = apps;
    this.APPSMap = APPSMap;
  }

  /** url query */
  urlQuery = {
    path: null,
    id: null,
  }

  /**
   *
   * @param key       key
   * @param value     value
   * @param pushState 是否操作路由
   */
  setUrlQuery(key, value, pushState = true) {
    const {urlQuery} = this;
    urlQuery[key] = value;
    if (pushState) {
      let pushUrl = "";

      if (key === 'path') {
        pushUrl = `?path=${value}`;
        queryKeys.forEach((queryKey) => {
          if (queryKey !== "path") {
            Reflect.deleteProperty(urlQuery, queryKey);
          }
        });
      } else {
        queryKeys.forEach((queryKey) => {
          const value = urlQuery[queryKey];
          if (value) {
            pushUrl = pushUrl + `${pushUrl ? "&" : "?"}${queryKey}=${value}`;
          }
        });
      }

      history.pushState(null, "", pushUrl);
    }
  }

  constructor() {
    const urlQuery = getUrlQuery();

    Reflect.deleteProperty(urlQuery, "");

    if (!urlQuery.path) {
      urlQuery.path = APP_DEFAULT_ACTIVE_MENUID;
    }

    let replaceUrl = "";

    queryKeys.forEach((queryKey) => {
      const value = urlQuery[queryKey];
      if (value) {
        replaceUrl =
          replaceUrl + `${replaceUrl ? "&" : "?"}${queryKey}=${value}`;
        this.setUrlQuery(queryKey, value, false);
      }
    });

    history.replaceState(JSON.parse(JSON.stringify(urlQuery)), "", replaceUrl);

    window.addEventListener("popstate", () => {
      const urlQuery = getUrlQuery();
      queryKeys.forEach((queryKey) => {
        this.setUrlQuery(queryKey, urlQuery[queryKey], false);
      });
    });
  }

  /** 用户信息 */
  user: null | User = null;

  /** 设置当前用户信息 */
  setUser(user: User | any) {
    this.user = user;
  }

  /** 只有管理员才能看见的模块namespaces */
  adminNameSpaces = ['app-store', 'mybricks-app-workflow'];
  /** 是否超级管理员 */
  isAdministrator: boolean = false;
  /** 设置是否超级管理员 */
  setIsAdministrator = (bool: boolean) => {
    this.isAdministrator = bool;
  }
}