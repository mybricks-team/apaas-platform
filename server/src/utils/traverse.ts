import { getStringBytes } from './logger'
import { maxLogRowContent, maxAboutWord } from '../constants'
import fs from 'fs'
export type TraversePath = Array<string | number> | undefined

/**
 * 遍历整个obj的第一层节点
 * @param obj 要遍历的对象，array或object
 * @param visit 访问函数，对访问到的属性key,val,path等进行处理
 * @param path 路径，访问的节点在obj中的路径
 */
export function traverseFirstLevel(
  obj: Array<any> | Object,
  path: TraversePath = [],
): void {
  const maxContentVal = '参数过长，无法展示'
  function perNode(key: string | number, val: any): void {
    const path1 = path ? path.concat([key]) : undefined
    const pathToParent = path1[path1.length - 1]
    obj[pathToParent] = val
    if ((typeof val === 'object' && val !== null)) {
      let stringVal = JSON.stringify(val)
      if (stringVal.length > maxAboutWord && getStringBytes(stringVal) > maxLogRowContent) {
        obj[pathToParent] = maxContentVal
      }
    }
    if (typeof val === 'string') {
      if (val.length > maxAboutWord && getStringBytes(val) > maxLogRowContent) {
        obj[pathToParent] = maxContentVal
      }
    }
  }

  if (Array.isArray(obj)) {
    for (let key = 0; key < obj.length; key++) perNode(key, obj[key])
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) perNode(key, obj[key])
  }
}



/** 处理请求body 或 params 数据，对于过长的进行处理 */
export function formatBodyOrParamsData(data: Record<string, any>) {
  traverseFirstLevel(data, [])
  return data
}
