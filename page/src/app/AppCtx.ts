import {FC} from 'react'

import {getUrlQuery} from '../utils'
import {FolderModule, FolderProject} from './components'

/** 用户信息 */
export interface User {
  /** id */
  id: number;
  /** 名称 */
  name?: string;
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

/** 只有管理员才能看见的模块namespaces */
const adminNameSpaces = ['app-store', 'mybricks-app-workflow']

const MYBRICKS_TEAM_USERS = [
  'charleszpq1995@gmail.com',
  'chemingjun@126.com',
  'chemingjun@kuaishou.com',
  'huangqiuyun03@kuaishou.com',
  'lianglihao@kuaishou.com',
  'liubiao03@kuaishou.com',
  'liulei11@kuaishou.com',
  'liuzhigang06@kuaishou.com',
  'tangxiaoxin@kuaishou.com',
  'yangxian05@kuaishou.com',
  'yankewen@kuaishou.com',
  'zhaoxing03@kuaishou.com',
  'zhulin08@kuaishou.com',
  'zhupengqiang@kuaishou.com',
  'zouyongsheng@kuaishou.com'
]

export default class AppCtx {

  urlQuery: any = {}
  locationSearch: string | null = null

  /** 用户信息 */
  user: null | User = null;
  /** 设置当前用户信息 */
  setUser(user: User | any) {
    this.user = user;
  }

  /** 是否平台超级管理员 */
  isAdministrator: boolean = false
  /** 设置是否平台超级管理员 */
  setIsAdministrator = (bool: boolean) => {
    this.isAdministrator = bool
  }

  FolderAPPS: Array<T_App> = [
    {
      title: '文件夹',
      description: '文件夹',
      type: 'user',
      extName: 'folder',
      namespace: 'mybricks-folder',
      icon: 'https://assets.mybricks.world/icon/folder.5782d987cf098ea8.png',
    },
    {
      title: '项目文件夹',
      description: '通过项目的方式管理文件',
      type: 'user',
      extName: 'folder-project',
      namespace: 'mybricks-folder-project',
      icon: FolderProject
    },
    {
      title: '模块文件夹',
      description: '通过模块的方式管理文件',
      type: 'user',
      extName: 'folder-module',
      namespace: 'mybricks-folder-module',
      icon: FolderModule
    },
  ];
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
      
    ];

    /** 平台默认,侧边栏应用 */
    const DockerAPPS: Array<T_App> = [
      /** TODO:暂时隐藏，目前应用也没有分享按钮 */
      // {
      //   title: '大家的分享',
      //   description: '大家的分享',
      //   type: 'user',
      //   extName: 'ground',
      //   namespace: 'ground',
      //   icon: 'https://assets.mybricks.world/icon/leileizi.png'
      // },
    ];

    const APPSMap: { [key: string]: T_App } = {};

    DesignAPPS.concat(this.FolderAPPS).forEach((app: T_App) => {
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
      if (!['system', 'user'].includes(app.type)) {
        APPSMap[app.type] = app;
      }
    });
    // 侧边栏应用
    this.DockerAPPS = DockerAPPS.filter(app => this.isAdministrator ? true : !adminNameSpaces.includes(app.namespace));
    // 原始安装应用列表
    this.InstalledAPPS = apps;
    this.APPSMap = APPSMap;


    // TODO:先写死，后续配置化
    const MYBRICKS_TEAM_USER_EMAILS = MYBRICKS_TEAM_USERS
    const IS_MYBRICKS_TEAM_USER = MYBRICKS_TEAM_USER_EMAILS.includes(this.user.email)
    if (!IS_MYBRICKS_TEAM_USER) {
      const SHOW_APPS_MAP = {
        'pc-cgn': true,
        'pc-page': true,
        'domain': true
      }
      const SHOW_FOLDERS_MAP = {
        'folder': true
      }
      // 搭建应用
      this.DesignAPPS = DesignAPPS.filter(app => {
        return (this.isAdministrator ? true : !adminNameSpaces.includes(app.namespace)) && SHOW_APPS_MAP[app.extName]
      });
      this.FolderAPPS = this.FolderAPPS.filter((app) => {
        return SHOW_FOLDERS_MAP[app.extName]
      })
    } else {
      // 搭建应用
      this.DesignAPPS = DesignAPPS.filter(app => this.isAdministrator ? true : !adminNameSpaces.includes(app.namespace));
    }
  }

  /** TODO:侧边栏相关操作 */
  sidebarInfo: {[key: string]: any} = {}

  refreshSidebar(namespace?: string) {
    return new Promise(async (resolve) => {
      const sideMenu = this.sidebarInfo[namespace || this.locationSearch]
      if (sideMenu?.open) {
        const items = await sideMenu.getFiles(sideMenu.id)
        sideMenu.items = items
      }
      resolve(true)
    })
  }
}