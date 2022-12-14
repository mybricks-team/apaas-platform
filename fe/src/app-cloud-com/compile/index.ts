
import data from './tpt/data.json'
import {tptRuntime} from './tpt/runtime'
import {tptEditors} from './tpt/editors'

export async function compile({title, version, namespace}, projectJson): Promise<{}> {
  return new Promise<{}>((resolve, reject) => {

    const {deps, inputs, outputs} = projectJson
    const realInputs = inputs.filter(pin => pin.type !== 'config')
    const configs = inputs.filter(pin => pin.type === 'config')

    //---data----------------------------------------

    if (configs) {
      configs.forEach(cfg => {
        data.configs[cfg.id] = cfg.extValues.defaultValue//init value
      })
    }

    //---runtime-------------------------------------
    let tptRT = tptRuntime.toString()

    tptRT = tptRT.substring(tptRT.indexOf(`return`) + 7, tptRT.length - 1)
    if (tptRT.match(/;\s*$/)) {//remove last ;
      tptRT = tptRT.substring(0, tptRT.lastIndexOf(';'))
    }

    tptRT = tptRT.replaceAll(/['"]__json__['"]/gi, /'__json__'/.test(tptRT) ? JSON.stringify(projectJson) : `{
      return ${JSON.stringify(projectJson)}
    }`)

    // const ueCode = []
    // if (configs) {
    //   configs.forEach(cfg => {
    //     ueCode.push(`
    //       React.useEffect(()=>{
    //         const curVal = data.configs['${cfg.id}']
    //         if(ref.current){
    //           ref.current.inputs['${cfg.id}'](curVal)
    //         }
    //       },[ref.current,data.configs['${cfg.id}']])
    //     `)
    //   })
    // }
    //
    // tptRT = tptRT.replaceAll(/['"]__ueCode__['"]/gi, ueCode.join(';'))


    //---edit-----------------------------------------


    let tptEdt = tptEditors.toString()

    tptEdt = tptEdt.substring(tptEdt.indexOf(`return`) + 7, tptEdt.length - 1)
    if (tptEdt.match(/;\s*$/)) {//remove last ;
      tptEdt = tptEdt.substring(0, tptEdt.lastIndexOf(';'))
    }
    tptEdt = tptEdt.replaceAll(/['"]__configs__['"]/gi, JSON.stringify(configs))


    //console.log(tptRT)/////TODO 拆分成单独的包

    const comDef = {
      namespace,
      title,
      data,
      version,
      runtime: tptRT,
      editors: tptEdt,
      inputs: void 0,
      outputs: void 0,
      deps,
    }

    if (realInputs) {
      const inDefs = []
      realInputs.forEach(ipt => {
        inDefs.push({
          id: ipt.id,
          title: ipt.title,
          schema: ipt.schema
        })
      })

      comDef.inputs = inDefs
    }

    if (outputs) {
      const outDefs = []
      outputs.forEach(ipt => {
        outDefs.push({
          id: ipt.id,
          title: ipt.title,
          schema: ipt.schema
        })
      })

      comDef.outputs = outDefs
    }

    resolve(comDef)
  })
}