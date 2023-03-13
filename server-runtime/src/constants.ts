export const COOKIE_LOGIN_USER = `mybricks-login-user`;

/** 获取物料时，返回的代码类型 */
export enum CodeType {
  /** editor 会同时返回 editor、runtime */
  EDITOR = "editor",
  /** es module runtime */
  ES_RUNTIME = "es_runtime",
  /** runtime 只会返回运行函数 */
  RUNTIME = "runtime",
}

/** 文件类型标识 */
export enum ExtName {
  COM_LIB = "com_lib",
  COMPONENT = "component",
  PC_PAGE = "pc-page",
  CLOUD_COM = "cloud-com",
  WORK_FLOW = "workflow",
}

/** 物料露出状态，-1-私有，0-workspace公开，1-全局公开 */
export enum MaterialScopeStatus {
  /** 私有 */
  PRIVATE = -1,
  /** workspace 局域公开 */
  WORKSPACE = 0,
  /** 全局公开 */
  PUBLIC = 1,
}

/** 生效状态 */
export enum EffectStatus {
  /** 删除 */
  DELETE = -1,
  /** 禁用 */
  DISABLED = 0,
  /** 生效中 */
  EFFECT = 1,
}

export const TaskTypeMap = {
  IMMEDIATE: 1,
  NORMAL: 2,
};

export const RunningStatusMap = {
  RUNNING: 1,
  RUNNING_WITH_ERROR: 11,
  STOPPED: -1,
};
