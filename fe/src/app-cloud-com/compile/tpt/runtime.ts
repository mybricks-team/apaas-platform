export function tptRuntime() {
  return function ({env, data, inputs: myInputs, outputs: myOutputs, useOnEvents}) {
    const React = window.React || window.react
    const {useMemo,useEffect} = React

    if (!React || typeof React !== "object" || !(typeof React.useMemo === "function")) {
      throw new Error(`window.React not found`)
    }

    const json = useMemo(() => {
      return '__json__'
    }, [])

    const [r, setR] = React.useState(React.createElement("div", null, "\u52A0\u8F7D\u4E2D..."))
    const ref = React.useRef()

    useEffect(()=>{
      const {inputs, outputs} = json
      if(inputs) {
        const configs = inputs.filter(pin => pin.type === 'config')
        configs.forEach(cfg=>{
          const curVal = data.configs[cfg.id]
          if(ref.current){
            ref.current.inputs[cfg.id](curVal)
          }
        })
      }
    },[])

    useMemo(() => {
      env.renderCom(json, {
        ref(refs) {
          if (!ref.current) {
            ref.current = refs
            const {inputs, outputs} = json
            if(inputs){
              inputs.forEach(ipt => {
                const id = ipt.id;
                if (myInputs.hasOwnProperty(id)) {
                  refs.inputs[ipt.id](myInputs[ipt.id])
                  myInputs[ipt.id] = refs.inputs[ipt.id];
                }
              })
            }
            if(outputs){
              outputs.forEach(opt => {
                const id = opt.id;
                let fn;
                if (useOnEvents) {
                  const oId = 'on' + id.replace(new RegExp(id[0]), id[0].toUpperCase());
                  if (myOutputs.hasOwnProperty(oId)) {
                    fn = myOutputs[oId]
                  }
                } else if (myOutputs.hasOwnProperty(id)) {
                  fn = myOutputs[id];
                }
                if (typeof fn === "function") {
                  refs.outputs(opt.id, fn);
                }
              });
            }
          }
        }
      }).then(rst => {
        setR(rst)
      })
    }, [])

    return r
  }
}