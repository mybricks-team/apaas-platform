import dayjs from 'dayjs'
import axios from 'axios'
import { message } from 'antd';

/**
 * 获取所需展示的时间
 * @param time 时间
 * @returns    最终展示的时间格式
 */
 export function UpdateTime(time: string | number): string {
  if (isToday(time)) {
    return dayjs(time).format("HH:mm");
  } else if (isThisYear(time)) {
    return dayjs(time).format("M月D日 HH:mm");
  }

  return dayjs(time).format("YYYY年M月D日");
}

/**
 * 判断时间是否今天
 * @param time 时间
 * @returns    是否今天
 */
function isToday(time: string | number): boolean {
  const t = dayjs(time).format("YYYY-MM-DD");
  const n = dayjs().format("YYYY-MM-DD");

  return t === n;
}

/**
 * 判断时间是否今年
 * @param time 时间
 * @returns    是否今年
 */
function isThisYear(time: string | number): boolean {
  const t = dayjs(time).format("YYYY");
  const n = dayjs().format("YYYY");

  return t === n;
}

/**
 * 复制到剪贴板
 * @param txt 需要复制的字符内容
 * @returns
 */
 export function copyText(txt: string): boolean {
  const input = document.createElement("input");
  document.body.appendChild(input);
  input.value = txt;
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);

  return true;
}

export function copyToClipboard(url) {
  copyText(url);
  message.info("已复制到剪切板");
}

export const _axios = axios.create({})

_axios.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data
    } else {
      return Promise.reject('http status is not 200')
    }
  },
  (error) => Promise.reject(error)
)

export class Uniqe {
  private uniqueKey = ''

  private uniqeMap = new Map()

  constructor(keyname) {
    this.uniqueKey = keyname
  }

  filterData = (dataSource) => {
    return dataSource.filter(item => {
      const val = item[this.uniqueKey]
      if (this.uniqeMap.has(val)) {
        return false
      }
      this.uniqeMap.set(val, true)
      return true
    })
  }

  reset = () => {
    this.uniqeMap = new Map() 
  }
}