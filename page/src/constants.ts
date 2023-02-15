import {AppCloudCom, AppPCPage, AppPCSys, AppTimer} from "./IconApps";

export const APP_TYPE_COMPONENT = `cloud-com`; //cloud-component
export const APP_TYPE_PC_PAGE = `pc-page`; //pc-management-system
export const APP_TYPE_TIMER_SERVICE = `timer-service`; //定时任务
export const APP_TYPE_FOLDER = 'folder';

export const COOKIE_LOGIN_USER = "mybricks-login-user";

export const APPS = [
  // {
  //   title: `云组件`,
  //   desc: '快速搭建PC页面，导出直接使用',
  //   type: APP_TYPE_COMPONENT,
  //   icon: AppCloudCom,
  //   impl: import('./app-component')
  // },
  {
    title: '文件夹',
    desc: '使用文件夹将各应用进行分类',
    type: APP_TYPE_FOLDER,
    icon: AppPCSys,
    impl: () => {console.log('点击')}
  },
  {
    title: `云组件`,
    desc: "使用组件搭建组件，发布npm在本地直接使用",
    type: APP_TYPE_COMPONENT,
    icon: AppCloudCom,
    impl: `./app-cloud-com.html`,
  },
  {
    title: `PC页面`,
    desc: "搭建PC页面，导出直接使用",
    type: APP_TYPE_PC_PAGE,
    icon: AppPCPage,
    impl: "./app-pc-page.html",
  },
  {
    title: `定时任务`,
    desc: "可视化搭建定时任务",
    type: APP_TYPE_TIMER_SERVICE,
    icon: AppTimer,
    impl: "./app-timer-service.html",
  },

];

export const APPSMap = {};

APPS.forEach(app => {
  const { type } = app;
  APPSMap[type] = app;
})

export const TaskTypeMap = {
  IMMEDIATE: 1,
  NORMAL: 2,
};

export const RENDER_WEB = "https://ali-ec.static.yximgs.com/udata/pkg/eshop/fangzhou/temp/index.min.js";

export const ComlibEditUrl = `https://f2.eckwai.com/kos/nlav12333/fangzhou/pub/comlibs/5665_1.0.49/2022-11-23_16-54-39/edit.js`

export const ComlibRtUrl = `https://f2.eckwai.com/kos/nlav12333/fangzhou/pub/comlibs/5665_1.0.49/2022-11-23_16-54-39/rt.js`