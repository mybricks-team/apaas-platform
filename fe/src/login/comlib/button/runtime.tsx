import {useCallback} from "react";

export default function ({env, data, outputs, slots,inputs, onError}) {
  const click = useCallback(() => {
    outputs['click']('www')
  }, [])

  return (
    <div>
      <button onClick={click} style={{padding: 100, backgroundColor: 'red'}}>我是一个测试组件</button>
      <div style={{height:100}}>
        {slots['content'].render()}
      </div>
    </div>

  )
}