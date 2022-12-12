/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mybricks@126.com
 */

export default {
  ':root': [
    {
      title: '标题',
      type: 'text',
      value: {
        get({data, input, output}) {
          return data.title
        },
        set({data, setDesc}, val) {
          data.title = val
        }
      }
    },
    {
      title: '单击2222',
      type: '_event',
      options: {
        outputId: 'click'
      }
    }
  ]
}



