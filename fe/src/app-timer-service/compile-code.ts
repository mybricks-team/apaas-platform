export default function createCompiler(json, comlibs) {
  let newJson = parse(json, comlibs);
  return generator(json, newJson);
}

function parse(json, comlibs) {
  let newJson = JSON.parse(JSON.stringify(json));
  let coms = getComs(comlibs);

  Object.keys(newJson.coms).forEach(key => {
    let com = newJson.coms[key];
    let namespace = com.def.namespace;

    com.runtime = coms.filter(raw => {
      return raw.namespace === namespace;
    })[0].runtime;
  });

  return newJson;

  function getComs(comlibs) {
    let coms = [];

    comlibs.forEach((comlib) => {
      let comAray = comlib.comAray || [];
      coms = coms.concat(comAray);
    });

    coms = coms.map((com: any) => {
      return {
        namespace: com.namespace,
        version: com.version,
        runtime: com.runtime.toString(),
      }
    });

    return coms;
  }
}

function generator(json, newJson) {
  let fns = [];

  Object.keys(newJson.coms).forEach(key => {
    let com = newJson.coms[key];
    let code = com.runtime.replace("function", `"${key}": function`);
    fns.push(code);
  });

  fns = fns.join(", \r \n");

  return `

  const axios = require('axios');
  const Vika = require("@vikadata/vika");

  const schema = ${JSON.stringify(json)};

  const fns = {
    ${fns}
  };

  class Runner {
    constructor(schema) {
      this.noop = Symbol("noop");
      this.eventBus = {};
      this.schema = schema;

      this.parse();
      this.autoRunComs();
    }

    parse() {
      let lines = getLines(this.schema.connections);
      setComsConditions.call(this, lines);

      function setComsConditions(lines) {
        lines.forEach(line => {
          let id = line.id;
          let pinId = line.pinId;

          this.eventBus[id] = this.eventBus[id] || {};
          this.eventBus[id][pinId] = this.noop;
        });
      }

      function getLines(connections) {
        let result = [];
        Object.keys(connections).forEach(key => {
          result = result.concat(connections[key]);
        });
        return result;
      }
    }

    autoRunComs() {
      this.schema.connections['_root_-start'].forEach(node => {
        this.eventBus[node.id][node.pinId] = undefined;
      });

      let nodes = this.schema.connections['_root_-start'].map(raw => {
        return raw.id;
      });

      nodes.forEach(node => {
        this.do(node);
      });
    }

    do(key) {
      let param = this.eventBus[key] || {};
      if (!preCheck.call(this, param)) {
        return;
      }

      let fn = fns[key];
      let data = this.schema.coms[key].model.data;

      fn(data, param).then((res) => {
        logger.log("执行节点结果", key, res);
        this.doNext(key, res);
      }).catch(err => {
        // 节点异常
        logger.error("执行节点异常", key, err);
      });

      function preCheck(param) {
        let keys = Object.keys(param);
        for (let i = 0; i < keys.length; i++) {
          if (param[keys[i]] === this.noop) {
            return false;
          }
        }
        return true;
      }
    }

    doNext(key, res) {
      let connections = this.schema.connections;
      let next = Object.keys(connections).filter(connection => {
        return connection.indexOf(key) === 0;
      });

      let nextNodes = connections[next];

      nextNodes && nextNodes.forEach(node => {
        this.eventBus[node.id][node.pinId] = res;
      });

      nextNodes && nextNodes.forEach(raw => {
        this.do(raw.id);
      });
    }

  }

  new Runner(schema);

  
  `;

}