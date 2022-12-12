import * as path from "path";
import * as fse from "fs-extra";
import * as request from "request";
import * as cp from "child_process";

import { uuid } from "./index";

const cwd = process.cwd();
const templatePath = path.join(cwd, "../assets/template");

/**
 * 云组件发布npm包
 * @param json 
 */
export function publishCloudComponentToNpm (json) {
  return new Promise(async (resolve, reject) => {
    /** 随机id防止覆盖纯字母即可 */
    const dirId = uuid();
    /** 当前copy出来的模版 */
    const dirTemplateName = `../assets/template${dirId}`;
    const dirTemplatePath = path.join(cwd, dirTemplateName);

    fse.copySync(templatePath, dirTemplatePath);

    const {
      deps,
      email,
      title,
      inputs,
      outputs,
      version,
      runtime,
      namespace
    } = json;
    
    const pkg = {
      /**
       * 命名空间+前缀 作为包名
       * TODO 可配置
       */
      name: `@mybricks-cloud/${namespace}`,
      /** 版本号 */
      version,
      /** TODO 描述信息 */
      description: "",
      /** 当前包发布人 */
      author: email,
      license: "ISC",
      dependencies: {
        /** TODO 下方是组件依赖项，后期由组件开发者提供依赖声明 */
        "antd": ">=4.21.6",
        "react": ">=16.8.0",
        "react-dom": ">=16.8.0",
        "@ant-design/icons": ">=4.7.0",
    
        /**
         * 下方是必须的依赖项
         * veaury vue/react 互转，阅读源码，是否能再最简实现
         * @mybricks/render-web web渲染器
         */
        "veaury": "^2.3.10",
        "@mybricks/render-web": "^1.0.25",
      }
    };

    /** 写入package.json */
    fse.writeJSONSync(path.join(dirTemplatePath, "package.json"), pkg, {
      spaces: 2
    });

    /** 写入npm相关配置 */
    fse.writeFileSync(path.join(dirTemplatePath, ".npmignore"), ".npmrc");
    /** TODO 可配置 */
    fse.writeFileSync(path.join(dirTemplatePath, ".npmrc"), `
      registry=https://registry.npmjs.org/
      //registry.npmjs.org/:_authToken="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"
      email=15958651599@163.com 
    `);
    
    /** TODO 可配置 */
    // const componentApi = "http://localhost:3000/api/material/namespace/content"; // 本地
    const componentApi = "https://mybricks.world/api/material/namespace/content"; // 线上

    /** 最终可以使用的组件列表 */
    const importComs = [];
    const importComsHash = {};

    /** TODO 嵌套情况，云组件使用云组件搭建的云组件... */
    await Promise.all(deps.map(dep => {
      return new Promise((resove, reject) => {
        const { version, namespace } = dep;
        const completeApi = `${componentApi}?version${version}&namespace=${namespace}&codeType=es_runtime`;

        request(completeApi, function (error, response, body) {
          if (error || response.statusCode !== 200) {

          } else {
            const requestResult = JSON.parse(body);
            const { code, data } = requestResult;

            if (code === 1) {
              const { esRuntime } = data;
              const id = namespace + version;

              // 组件代码正常加载且未添加至importComs列表
              if (esRuntime && !importComsHash[id]) {
                const componentFileName = `MybricksCloudComponent${id}.js`;

                fse.writeFileSync(path.join(dirTemplatePath, `./deps/${componentFileName}`), esRuntime);
                importComs.push({
                  fileId: uuid(),
                  componentFileName,
                  comKey: `${namespace}-${version}`
                });
              }
            }
          }

          resove(true);
        });
      });
    }));

    /** react/vue 入口模版 */
    const reactIndexPath = path.join(dirTemplatePath, "./react/index.js");
    const reactIndex = fse.readFileSync(reactIndexPath, 'utf-8');
    const reactDTSPath = path.join(dirTemplatePath, "./react/index.d.ts");
    const reactDTS = fse.readFileSync(reactDTSPath, 'utf-8');
    const vueIndexPath = path.join(dirTemplatePath, "./vue/index.js");
    const vueIndex = fse.readFileSync(vueIndexPath, 'utf-8');
    const vueDTSPath = path.join(dirTemplatePath, "./vue/index.d.ts");
  const vueDTS = fse.readFileSync(vueDTSPath, 'utf-8');

    /** 拼装依赖组件信息 */
    let comDefsCode = ``;

    importComs.forEach(({comKey, fileId, componentFileName}) => {
      comDefsCode = comDefsCode + `
        import ${fileId} from "../deps/${componentFileName}";

        comDefs["${comKey}"] = {
          runtime: ${fileId}
        }`;
    });

    const vueIOCode = getIOCode(inputs, outputs, true);
    const reactIOCode = getIOCode(inputs, outputs, false);

    let useEffectCode = '';
    let reactPropsStr = "";
    let vuePropsStr = "";
    let vueEnvents = "";
    let vueOnEvents = "";

    inputs.forEach(({id, title, schema}) => {
      useEffectCode = useEffectCode + `
        React.useEffect(() => {
          if (typeof ctx.current.inputs["${id}"] === "function" && props.hasOwnProperty("${id}")) {
            ctx.current.inputs["${id}"](props["${id}"]);
          }
        }, [props["${id}"]]);
      `;

      const reactTypeStr = getTypeStr({id, title, schema});
      const vueTypeStr = getTypeStr({id, title, schema, isVue: true});

      reactPropsStr = reactPropsStr + reactTypeStr;
      vuePropsStr = vuePropsStr + vueTypeStr;
    });

    outputs.forEach(({id, title, schema}) => {
      const reactTypeStr = getTypeStr({id, title, schema, isFn: true});
      const vueTypeStr = getTypeStr({id, title, schema, isFn: true, isVue: true});

      reactPropsStr = reactPropsStr + reactTypeStr;

      vueEnvents = vueEnvents + vueTypeStr.replace("=> void", "=> true");
      vueOnEvents = vueOnEvents + vueTypeStr.replace(`${id}:`, `${"on" + id.replace(new RegExp(id[0]), id[0].toUpperCase())}?:`);
    });


    /** 字符串替换 */
    const reactCode = reactIndex
      .replace("'--comDefs--'", comDefsCode)
      .replace("'--RenderCom--'", runtime.replace("function", "function RenderCom"))
      .replace("'--io--'", reactIOCode + useEffectCode);
    const vueCode = vueIndex
      .replace("'--comDefs--'", comDefsCode)
      .replace("'--RenderCom--'", runtime.replace("function", "function RenderCom"))
      .replace("'--io--'", vueIOCode + useEffectCode);

    fse.writeFileSync(reactIndexPath, reactCode);
    fse.writeFileSync(vueIndexPath, vueCode);
    fse.writeFileSync(
      reactDTSPath,
      reactDTS
        .replace("'--props--'", reactPropsStr)
        .replace("'--name--'", title)
    );
    fse.writeFileSync(
      vueDTSPath,
      vueDTS
        .replace(/'--props--'/g, vuePropsStr)
        .replace("'--name--'", title)
        .replace("'--@events--'", vueEnvents)
        .replace("'--onEvents--'", vueOnEvents)
    );

    /**
     * 发包
     * TODO yarn命令启动服务，npm publish命令.npmrc内配置的源链接被篡改
     */
    cp.exec(`cd ${dirTemplatePath} && npm publish --access public`, (error, _stdout, _stderr) => {
      fse.remove(dirTemplatePath);
      resolve({version, namespace, error, _stdout, _stderr});
      // if (error) {
      //   console.error(`exec error: ${error}`);
      //   return;
      // }
      // console.log(`stdout: ${stdout}`);
      // console.error(`stderr: ${stderr}`);
    });
  })
}

function getIOCode (inputs, outputs, useOnEvents) {
  return `
    var ctx = React.useRef(null);

    React.useMemo(() => {
      var inputs = ${JSON.stringify(inputs)};
      var outputs = ${JSON.stringify(outputs)};
      var inputsMap = {};
      var outputsMap = {};
      inputs.forEach(ipt => {
        var id = ipt.id;
        if (props.hasOwnProperty(id)) {
          inputsMap[id] = props[id];
        }
      });
      outputs.forEach(ipt => {
        var id = ipt.id;
        ${useOnEvents ? "id = 'on' + id.replace(new RegExp(id[0]), id[0].toUpperCase());" : ""};
        if (props.hasOwnProperty(id)) {
          const fn = props[id];
          if (typeof fn === "function") {
            outputsMap[id] = props[id];
          }
        }
      });
      ctx.current = {
        inputs: inputsMap,
        outputs: outputsMap
      }
    }, []);
  `;
}

function getTypeStr ({id, title, schema, isFn = false, isVue = false}, index = 1, typeStr = "") {
  const { type } = schema;
  const spaceStr = (new Array(index * 2).fill(" ")).join("");
  const jsDoc = title ? `${spaceStr}/** ${title} */\n` : "";

  switch(type) {
    case "string":
    case "number":
    case "boolean":
      typeStr = id ? `${spaceStr}${id}${(index === 1 && !isVue) ? "?" : ""}: ${type};\n` : type;
      break;
    case "object":
      const { properties } = schema;
      let objectTypeStr = "";
      
      if (typeof properties === "object") {
        Object.keys(properties).forEach(key => {
          objectTypeStr = objectTypeStr + getTypeStr({id: key, title: "", schema: properties[key], isVue}, index + 1);
        })
      }

      typeStr = id ? `${spaceStr}${id}${(index === 1 && !isVue) ? "?" : ""}: ${(isVue && index === 1 && !isFn) ? "PropType<" : ""}{\n${objectTypeStr}\n${spaceStr}}${(isVue && index === 1 && !isFn) ? ">" : ""}\n` : objectTypeStr;
      break;
    case "array":
      const { items } = schema;
      let arrayTypeStr = "";
      let childType = "object";

      if (typeof items === "object") {
        arrayTypeStr = arrayTypeStr + getTypeStr({id: null, title: null, schema: items});
        childType = items.type;
      }

      const useBraces = childType === "object";

      typeStr = `${spaceStr}${id}${(index === 1 && !isVue) ? "?" : ""}: ${(isVue && index === 1 && !isFn) ? "PropType<" : ""}Array<${useBraces ? "{\n" : ""}${arrayTypeStr}${useBraces ? `\n${spaceStr}` : ""}${useBraces ? "}": ""}>${(isVue && index === 1 && !isFn) ? ">" : ""}\n`;
      break;
    default:
      break
  }

  if (isFn && index === 1) {
    typeStr = `${spaceStr}${id}${(index === 1 && !isVue) ? "?" : ""}: (${typeStr.replace(id, "val").replace(/\?:/, ":").replace(/\s/g, "").replace(/;$/, "")}) => void;\n`;
  }

  return jsDoc + typeStr;
}
