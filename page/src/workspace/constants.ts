import {
  IconFolder,
  IconTimedTask,
  IconAppPCPage,
  IconAppCloudCom
} from './icon';

/** 云组件 */
export const APP_TYPE_COMPONENT = 'cloud-com';
/** pc页面 */
export const APP_TYPE_PC_PAGE = 'pc-page';
/** 定时任务 */
export const APP_TYPE_TIMER_SERVICE = 'timer-service';
/** 文件夹 */
export const APP_TYPE_FOLDER = 'folder';
/** 应用类型列表 */
export const APPS = [
  {
    title: '文件夹',
    desc: '使用文件夹将各应用进行分类',
    type: APP_TYPE_FOLDER,
    Icon: IconFolder,
    impl: () => {console.log('点击')}
  },
  // {
  //   title: `云组件`,
  //   desc: "使用组件搭建组件，发布npm在本地直接使用",
  //   type: APP_TYPE_COMPONENT,
  //   Icon: IconAppCloudCom,
  //   impl: `./app-cloud-com.html`,
  // },
  // {
  //   title: `PC页面`,
  //   desc: "搭建PC页面，导出直接使用",
  //   type: APP_TYPE_PC_PAGE,
  //   Icon: IconAppPCPage,
  //   impl: "./app-pc-page.html",
  // },
  // {
  //   title: `定时任务`,
  //   desc: "可视化搭建定时任务",
  //   type: APP_TYPE_TIMER_SERVICE,
  //   Icon: IconTimedTask,
  //   impl: "./app-timer-service.html",
  // },
];
/** 快速检索App信息 */
export const APPSMap = {};
APPS.forEach(app => {
  const { type } = app;
  APPSMap[type] = app;
})
/** 定时任务 */
export const TaskTypeMap = {
  IMMEDIATE: 1,
  NORMAL: 2,
};
