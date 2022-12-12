/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mybricks@126.com
 */

import buttonDef from './button/com.json'
import buttonRt from './button/runtime'
import buttonEdt from './button/editors'

import buttonDef from './button/com.json'
import buttonRt from './button/runtime'
import buttonEdt from './button/editors'

const lib = {
  id: 'mybricks-lib-test',
  title: '测试组件库',
  author: 'CheMingjun',
  icon: '',
  version: '1.0.1',
  comAray: [
    merge({
      comDef: buttonDef,
      rt: buttonRt,
      editors: buttonEdt
    })
  ],
  //visible: true,
  //visible: false
}

export default lib

export function getCom(namespace: string) {
  return lib.comAray.find(com => com.namespace === namespace)
}

function merge({comDef, rt, data, editors, assistence}: { comDef, rt?, data?, editors?, assistence? }) {
  return Object.assign(comDef, {
    runtime: rt,
    data,
    editors,
    assistence
  })
}