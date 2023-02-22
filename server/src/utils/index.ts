import * as moment from "dayjs";

export function uuid(length = 32): string {
  let text = "";

  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export const Logs = {
  info(content: string) {
    console.log(
      `[Mybricks] - ${moment(new Date()).format(
        "YYYY-MM-DD HH:mm:ss"
      )} ${content}`
    );
  },
};

export function versionGreaterThan(version1, version2) {
  return (
    compareVersion(version1.replace(/_/g, "."), version2.replace(/_/g, ".")) > 0
  );
}

function compareVersion(version1, version2) {
  const arr1 = version1.split(".");
  const arr2 = version2.split(".");
  const length1 = arr1.length;
  const length2 = arr2.length;
  const minlength = Math.min(length1, length2);
  let i = 0;
  for (i; i < minlength; i++) {
    let a = parseInt(arr1[i]);
    let b = parseInt(arr2[i]);
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    }
  }
  if (length1 > length2) {
    for (let j = i; j < length1; j++) {
      if (parseInt(arr1[j]) != 0) {
        return 1;
      }
    }
    return 0;
  } else if (length1 < length2) {
    for (let j = i; j < length2; j++) {
      if (parseInt(arr2[j]) != 0) {
        return -1;
      }
    }
    return 0;
  }
  return 0;
}

/** parse JSON string，同时 catch 错误 */
export const safeParse = (content: string, defaultValue = {}) => {
  try {
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
};

/** 编码 */
export const safeEncodeURIComponent = (content: string) => {
  try {
    return encodeURIComponent(content);
  } catch {
    return content ?? "";
  }
};

/** 解码 */
export const safeDecodeURIComponent = (content: string) => {
  try {
    return decodeURIComponent(content);
  } catch {
    return content ?? "";
  }
};

export function getNextVersion(version, max = 100) {
  if (!version) return "1.0.0";
  const vAry: any[] = version.split(".");
  let carry: boolean = false;
  const isMaster = vAry.length === 3;
  if (!isMaster) {
    max = -1;
  }

  for (let i = vAry.length - 1; i >= 0; i--) {
    const res: number = Number(vAry[i]) + 1;
    if (i === 0) {
      vAry[i] = res;
    } else {
      if (res === max) {
        vAry[i] = 0;
        carry = true;
      } else {
        vAry[i] = res;
        carry = false;
      }
    }
    if (!carry) break;
  }

  return vAry.join(".");
}

export function getRealHostName(requestHeaders) {
  let hostName = requestHeaders.host
  if(requestHeaders['x-forwarded-host']) {
    hostName = requestHeaders['x-forwarded-host']
  } else if(requestHeaders['x-host']) {
    hostName = requestHeaders['x-host'].replace(':443', '')
  }
  return hostName
}

export function getRealDomain(request) {
  let hostName = getRealHostName(request.headers);
  let domain = `${request.protocol}:\/\/${hostName}`
  return domain
}

export { isNumber } from './type'
