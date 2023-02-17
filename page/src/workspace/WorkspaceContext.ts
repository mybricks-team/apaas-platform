import {FC} from 'react';

import AppStore from './app-store';
import {getUrlQuery} from '../utils';

import { FolderProject, FolderModule, UserGroup } from './icon' 

export type APP_MENU_ITEM_ID = "my-project" | "running-task";

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
//   {id: 'my-project', label: '我的项目', Icon: IconMyProjects},
//   // {id: 'running-task', label: '运行中的任务', Icon: IconTimedTask}
// ];

/** 默认选中 */
export const APP_DEFAULT_ACTIVE_MENUID = "my-project";

/** 菜单栏列表 */
export const APP_MENU_ITEMS: Array<T_App> = [
  {
    title: "我的项目",
    description: "我的项目",
    type: "system",
    namespace: "my-project",
    icon: "https://assets.mybricks.world/icon/myprojects.7cd8f4c7813982aa.png",
  },
  {
    title: "协作组",
    description: "协作组",
    type: "system",
    namespace: "group",
    icon: UserGroup
  },
  // 暂时注释TODO
  // {
  //   title: '运行中的任务',
  //   description: '运行中的任务',
  //   type: 'running-task',
  //   namespace: 'running-task',
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
  icon: string | ((...args: any) => JSX.Element);
  /** 应用类型类型: 系统、用户 */
  type: string;
  /** 搭建应用类型 */
  extName?: string;
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
        type: 'user',
        extName: "folder",
        namespace: "mybricks-folder",
        icon: "https://assets.mybricks.world/icon/folder.5782d987cf098ea8.png",
      },
      {
        title: "项目文件夹",
        description: "通过项目的方式管理文件",
        type: 'user',
        extName: "folder-project",
        namespace: "mybricks-folder-project",
        icon: FolderProject
      },
      {
        title: "模块文件夹",
        description: "通过模块的方式管理文件",
        type: 'user',
        extName: "folder-module",
        namespace: "mybricks-folder-module",
        icon: FolderModule
      },
    ];

    /** 平台默认,侧边栏应用 */
    const DockerAPPS: Array<T_App> = [
      {
        title: "大家的分享",
        description: "大家的分享",
        type: 'user',
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

  /** 应用路径 */
  appPath = ''

  /**
   *
   * @param path      应用路径
   * @param pushState 是否操作路由
   */
  gotoApp(path, pushState = true) {
    if (this.appPath !== path) {
      this.appPath = path;
      if (pushState) {
        history.pushState(null, "", `?app=${path}`);
      }
    }
  }

  constructor() {
    const urlQuery = getUrlQuery();
    const { app } = urlQuery;
    this.gotoApp(app, false)

    // window.addEventListener("popstate", () => {
    //   const urlQuery = getUrlQuery();
    //   const { app } = urlQuery;
    //   this.gotoApp(app, false);
    // });
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
