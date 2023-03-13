let DB_CONN = null;
let GLOBAL_RESOLVE = null;
let GLOBAL_REJECT = null;
const safeStringify = (obj, indent) => {
    let cache = [];
    const retVal = JSON.stringify(obj, (key, value) => typeof value === "object" && value !== null
        ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
        : value, indent || 2);
    cache = null;
    return retVal;
};
const _execSQL = async (sql, { args }) => {
    if (!DB_CONN) {
        const { getConnection } = require("@mybricks/rocker-dao");
        DB_CONN = await getConnection();
    }
    const conn = DB_CONN;
    const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
        return ' ';
    });
    let param = {
        sql: handledSql,
        timeout: 10 * 1000,
    };
    if (args) {
        param["values"] = args;
    }
    return new Promise((resolve, reject) => {
        let tdId = conn.threadId;
        conn.beginTransaction(function (_e) {
            if (_e) {
                console.log(`【执行SQL】：【${tdId}】: Transaction failed：${_e?.message}`);
                reject(_e);
            }
            console.log(`【执行SQL】：【${tdId}】:  Transaction start`);
            try {
                conn.query(param, args, function (error, results) {
                    if (error) {
                        console.log(`【执行SQL】：【${tdId}】：执行业务SQL失败：${error.message}`);
                        conn.rollback(function () {
                            console.log(`【执行SQL】：【${tdId}】：Transaction rollback`);
                        });
                        reject(error);
                    }
                    conn.commit(function (err) {
                        if (err) {
                            conn.rollback(function () {
                                console.log(`【执行SQL】：【${tdId}】：Transaction rollback`);
                            });
                            reject(err);
                        }
                    });
                    resolve(results);
                }).once('end', () => {
                    conn.release();
                });
            }
            catch (e) {
                conn.rollback(function () {
                    console.log(`【执行SQL】：【${tdId}】：Transaction Query Failed: Connection Released`);
                });
                conn.release();
                reject(e);
            }
        });
    });
};
const Logger = (taskId) => {
    return {
        log: (...args) => {
            console.log(...args)
        },
        error: (...args) => {
            console.log(...args)
        },
    };
};
const Hooks = (taskId) => {
    return {
      onFinished: (data) => {
        GLOBAL_RESOLVE(data)
        },
        onError: (msg) => {
            GLOBAL_RESOLVE(msg)
        },
    };
};
const UTIL = (taskId) => {
    return {
        execSQL: async (sql, args) => {
            let res = null;
            return new Promise((resolve, reject) => {
                try {
                    console.log('【执行SQL】：开始执行沙箱内sql')
                    _execSQL(sql, { args: args }).then(res => {
                        resolve(res)
                    })
                }
                catch (error) {
                    console.log(safeStringify({
                        action: `TASK_ERROR`,
                        taskId,
                        data: `【执行SQL】：执行沙箱内sql出错: ${error?.message}`,
                    }));
                }
            });
        },
        genUniqueId: () => {
            return snowFlake.NextId();
        }
    };
};

;const _EXEC_ID_ = 'rtExGjlWANpBBLuo';
;const hooks = Hooks(_EXEC_ID_);
;const logger = Logger(_EXEC_ID_);
;const Util = UTIL(_EXEC_ID_);
;let PARAMS = "%7B%7D";
;PARAMS = JSON.parse(decodeURIComponent(PARAMS));
if(typeof PARAMS === 'string') {
PARAMS = JSON.parse(PARAMS)
}
                              

  // 组件库添加位置
  !function(_,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.MybricksComDef=e():_.MybricksComDef=e()}(global,(()=>(()=>{var __webpack_modules__={792:(_,e,t)=>{"use strict";t.d(e,{eC:()=>r});var r=function(_){try{return decodeURIComponent(_)}catch(e){return null!=_?_:""}}},594:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var __assign=function(){return __assign=Object.assign||function(_){for(var e,t=1,r=arguments.length;t<r;t++)for(var n in e=arguments[t])Object.prototype.hasOwnProperty.call(e,n)&&(_[n]=e[n]);return _},__assign.apply(this,arguments)},getFnString=function(_,e){return"function _RT_ ({".concat(e.join(","),"}) {").concat(_,"}")};function __WEBPACK_DEFAULT_EXPORT__(_a){var env=_a.env,data=_a.data,inputs=_a.inputs,outputs=_a.outputs,logger=_a.logger,onError=_a.onError,fns=data.fns,runImmediate=data.runImmediate,runJSParams={outputs};try{runImmediate&&env.runtime&&eval(decodeURIComponent(fns))(runJSParams),inputs.input0((function(val){try{eval(decodeURIComponent(fns))(__assign(__assign({},runJSParams),{inputValue:val}))}catch(_){null==onError||onError(_),console.error("js计算组件运行错误.",_),logger.error("".concat(_))}}))}catch(_){null==onError||onError(_),console.error("js计算组件运行错误.",_),logger.error("".concat(_))}}},566:(_,e,t)=>{"use strict";function r(_){var e=_.env,t=_.data,r=_.outputs,n=_.inputs,a=_.onError;n.params((function(_,n){t.sqlString&&e.executeSql(t.sqlString).then((function(_){_.rows&&r.rtn(_.rows),_.insertId&&r.rtn(_.insertId)})).catch((function(_){a("执行SQL发生错误,".concat(null==_?void 0:_.message))}))}))}t.d(e,{Z:()=>r})},957:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var _utils_util__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(792);function __WEBPACK_DEFAULT_EXPORT__(_a){var env=_a.env,data=_a.data,outputs=_a.outputs,inputs=_a.inputs,onError=_a.onError;inputs.params((function(val,relOutpus){var _a,script=(0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(null===(_a=data.rules)||void 0===_a?void 0:_a.script);if(script){var sql=eval(script)(val);env.executeSql(sql).then((function(_){outputs.rtn()})).catch((function(_){onError("执行SQL发生错误,".concat(null==_?void 0:_.message))}))}}))}},284:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var _utils_util__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(792);function __WEBPACK_DEFAULT_EXPORT__(_a){var env=_a.env,data=_a.data,outputs=_a.outputs,inputs=_a.inputs,onError=_a.onError;inputs.params((function(val,relOutpus){var _a,script=(0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(null===(_a=data.rules)||void 0===_a?void 0:_a.script);if(script){var sql=eval(script)(val,env);env.executeSql(sql).then((function(_){var e,t;outputs.rtn(_.insertId||(null===(t=null===(e=_.rows)||void 0===e?void 0:e[0])||void 0===t?void 0:t.insertId))})).catch((function(_){onError("执行SQL发生错误,".concat(null==_?void 0:_.message))}))}}))}},47:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var _utils_util__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(792);function __WEBPACK_DEFAULT_EXPORT__(_a){var _b,env=_a.env,data=_a.data,outputs=_a.outputs,inputs=_a.inputs,onError=_a.onError,script=(0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(null===(_b=data.selector)||void 0===_b?void 0:_b.script);script&&(data.autoRun&&eval(script)({},env.executeSql).then((function(_){outputs.rtn(_)})).catch((function(_){onError("执行SQL发生错误,".concat(null==_?void 0:_.message))})),inputs.params((function(val){eval(script)(val,env.executeSql).then((function(_){outputs.rtn(_)})).catch((function(_){onError("执行SQL发生错误,".concat(null==_?void 0:_.message))}))})))}},63:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var _utils_util__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(792),__assign=function(){return __assign=Object.assign||function(_){for(var e,t=1,r=arguments.length;t<r;t++)for(var n in e=arguments[t])Object.prototype.hasOwnProperty.call(e,n)&&(_[n]=e[n]);return _},__assign.apply(this,arguments)},__awaiter=function(_,e,t,r){return new(t||(t=Promise))((function(n,a){function o(_){try{i(r.next(_))}catch(_){a(_)}}function u(_){try{i(r.throw(_))}catch(_){a(_)}}function i(_){var e;_.done?n(_.value):(e=_.value,e instanceof t?e:new t((function(_){_(e)}))).then(o,u)}i((r=r.apply(_,e||[])).next())}))},__generator=function(_,e){var t,r,n,a,o={label:0,sent:function(){if(1&n[0])throw n[1];return n[1]},trys:[],ops:[]};return a={next:u(0),throw:u(1),return:u(2)},"function"==typeof Symbol&&(a[Symbol.iterator]=function(){return this}),a;function u(u){return function(i){return function(u){if(t)throw new TypeError("Generator is already executing.");for(;a&&(a=0,u[0]&&(o=0)),o;)try{if(t=1,r&&(n=2&u[0]?r.return:u[0]?r.throw||((n=r.return)&&n.call(r),0):r.next)&&!(n=n.call(r,u[1])).done)return n;switch(r=0,n&&(u=[2&u[0],n.value]),u[0]){case 0:case 1:n=u;break;case 4:return o.label++,{value:u[1],done:!1};case 5:o.label++,r=u[1],u=[0];continue;case 7:u=o.ops.pop(),o.trys.pop();continue;default:if(!((n=(n=o.trys).length>0&&n[n.length-1])||6!==u[0]&&2!==u[0])){o=0;continue}if(3===u[0]&&(!n||u[1]>n[0]&&u[1]<n[3])){o.label=u[1];break}if(6===u[0]&&o.label<n[1]){o.label=n[1],n=u;break}if(n&&o.label<n[2]){o.label=n[2],o.ops.push(u);break}n[2]&&o.ops.pop(),o.trys.pop();continue}u=e.call(_,o)}catch(_){u=[6,_],r=0}finally{t=n=0}if(5&u[0])throw u[1];return{value:u[0]?u[1]:void 0,done:!0}}([u,i])}}};function __WEBPACK_DEFAULT_EXPORT__(_a){var _this=this,_b,env=_a.env,data=_a.data,outputs=_a.outputs,inputs=_a.inputs,onError=_a.onError,script=null===(_b=data.selector)||void 0===_b?void 0:_b.script;script&&(data.autoRun?script.list&&Promise.all([eval((0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(script.list))({},env.executeSql),eval((0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(script.total))({},env.executeSql)]).then((function(_){var e=_[0],t=_[1];outputs.rtn({list:e.rows,total:t.rows[0].total})})).catch((function(_){onError("执行SQL发生错误,".concat(null==_?void 0:_.message))})):inputs.params((function(val,outputRels){return __awaiter(_this,void 0,void 0,(function(){var values,data_1,countData,e_1,_a;return __generator(this,(function(_b){switch(_b.label){case 0:if(values=__assign(__assign({},val.pageParams||{}),val.params||{}),!script.list)return[3,5];_b.label=1;case 1:return _b.trys.push([1,4,,5]),[4,eval((0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(script.list))(values,env.executeSql)];case 2:return data_1=_b.sent(),[4,eval((0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(script.total))(values,env.executeSql)];case 3:return countData=_b.sent(),outputs.rtn({list:data_1,total:null===(_a=countData[0])||void 0===_a?void 0:_a.total}),[3,5];case 4:return e_1=_b.sent(),onError("执行SQL发生错误,".concat(null==e_1?void 0:e_1.message)),[3,5];case 5:return[2]}}))}))})))}},533:(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var _utils_util__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(792);function __WEBPACK_DEFAULT_EXPORT__(_a){var env=_a.env,data=_a.data,outputs=_a.outputs,inputs=_a.inputs,onError=_a.onError;inputs.params((function(val,relOutpus){var _a,script=(0,_utils_util__WEBPACK_IMPORTED_MODULE_0__.eC)(null===(_a=data.rules)||void 0===_a?void 0:_a.script);if(script){var sql=eval(script)(val);env.executeSql(sql).then((function(_){outputs.rtn()})).catch((function(_){onError("执行SQL发生错误,".concat(null==_?void 0:_.message))}))}}))}},766:(_,e,t)=>{"use strict";t.d(e,{Z:()=>c});var r="output",n=function(){return n=Object.assign||function(_){for(var e,t=1,r=arguments.length;t<r;t++)for(var n in e=arguments[t])Object.prototype.hasOwnProperty.call(e,n)&&(_[n]=e[n]);return _},n.apply(this,arguments)},a=function(_,e,t){if(t||2===arguments.length)for(var r,n=0,a=e.length;n<a;n++)!r&&n in e||(r||(r=Array.prototype.slice.call(e,0,n)),r[n]=e[n]);return _.concat(r||Array.prototype.slice.call(e))},o=["Array","Object"],u=function(_){var e;return null===(e=Object.prototype.toString.call(_).match(/\[object (.*)\]/))||void 0===e?void 0:e[1]},i=function(_){var e=new Set(_.reduce((function(_,e){return void 0===_&&(_=[]),a(a([],_,!0),e,!0)}),[]));return Array.from(e)},s=function(_){return _.reduce((function(_,e){return void 0===_&&(_={}),n(n({},_),e)}),{})};function c(_){var e=_.env,t=_.data,n=_.inputs,a=_.outputs,c=e.runtime,l=t.isMerge,p=Object.keys(n).length,v=[],d=new Set,b={Array:i,Object:s};c&&Object.keys(n).forEach((function(_,e){n[_]((function(t){if(v[e]=t,d.add(_),d.size===p){var n=function(_){var e=_[0],t=_.slice(1),r=u(e);if(r&&o.includes(r))return Object.values(t).every((function(_){return u(_)===r}))?r:null}(v);l&&n?a[r](b[n](v)):a[r](function(_,e,t){if(t||2===arguments.length)for(var r,n=0,a=e.length;n<a;n++)!r&&n in e||(r||(r=Array.prototype.slice.call(e,0,n)),r[n]=e[n]);return _.concat(r||Array.prototype.slice.call(e))}([],v,!0)),v=[],d.clear()}}))}))}}},__webpack_module_cache__={};function __webpack_require__(_){var e=__webpack_module_cache__[_];if(void 0!==e)return e.exports;var t=__webpack_module_cache__[_]={exports:{}};return __webpack_modules__[_](t,t.exports,__webpack_require__),t.exports}__webpack_require__.d=(_,e)=>{for(var t in e)__webpack_require__.o(e,t)&&!__webpack_require__.o(_,t)&&Object.defineProperty(_,t,{enumerable:!0,get:e[t]})},__webpack_require__.o=(_,e)=>Object.prototype.hasOwnProperty.call(_,e);var __webpack_exports__={};return(()=>{let _="undefined"==typeof window?global:window,e=_.__comlibs_rt_;e||(e=_.__comlibs_rt_=[]);const t=[];let r;e.push({id:"@mybricks/comlib-domain-normal",title:"MyBricks领域建模通用组件库",version:"0.0.8",comAray:t}),r={namespace:"mybricks.domain.select",version:"1.0.0",runtime:__webpack_require__(47).Z},t.push(r),r={namespace:"mybricks.domain.selectByPager",version:"1.0.0",runtime:__webpack_require__(63).Z},t.push(r),r={namespace:"mybricks.domain.dbInsert",version:"1.0.0",runtime:__webpack_require__(284).Z},t.push(r),r={namespace:"mybricks.domain.dbUpdate",version:"1.0.0",runtime:__webpack_require__(533).Z},t.push(r),r={namespace:"mybricks.domain.dbDelete",version:"1.0.0",runtime:__webpack_require__(957).Z},t.push(r),r={namespace:"mybricks.domain.segment",version:"1.0.0",runtime:__webpack_require__(594).Z},t.push(r),r={namespace:"mybricks.domain.data.merge",version:"1.0.0",runtime:__webpack_require__(766).Z},t.push(r),r={namespace:"mybricks.domain.dbChatGpt",version:"1.0.0",runtime:__webpack_require__(566).Z},t.push(r)})(),__webpack_exports__})()));
  //# sourceMappingURL=rt.js.map;
  const EXECUTE_SQL = async (sql) => {const tableNames = ["系统用户","姓名"];const systemTableNames = ["系统用户"];const curSQL = sql.replace(new RegExp("(\\s+|\\(\\s*)(系统用户|姓名)(?=\\s*|\\s*,\\s*|\\.|\\s*\\)|$)", "ig"),($0, $1, $2) => {return $1 + (systemTableNames.includes($2) ? "D_389_" : (tableNames.includes($2) ? "D_389_" : "")) + $2 + "_VIEW";});(logger || console).log("执行 SQL：", curSQL);try {const rows = await Util.execSQL(curSQL);return { rows };} catch (e) {(logger || console).log("执行 SQL 错误：", e);return Promise.resolve({ rows: [] });}};

  const createContext = () => {
    let context
    const execBeforeFinished = async () => {
      for (let cb of context._beforeFinishCallbacks) {
        await cb()
      }
      context.isExit = true
    }

    const onBeforeFinished = cb => {
      if (context._beforeFinishCallbacks.indexOf(cb) === -1) {
        context._beforeFinishCallbacks.push(cb)
      }
    }

    context = {
      isExit: false,
      logger: typeof logger === "undefined" ? console : logger,
      PARAMS: typeof PARAMS === "undefined" ? {} : PARAMS,
      _EXEC_ID_: typeof _EXEC_ID_ === "undefined" ? "" : _EXEC_ID_,
      executeSql: EXECUTE_SQL,
      genUniqueId: Util.genUniqueId,
      WORK_FLOW_INFO:
        typeof WORK_FLOW_INFO === "undefined" ? {} : WORK_FLOW_INFO,
      // 添加一些结束前的回调
      _beforeFinishCallbacks: [],
      runtime: true,
      hooks:
        typeof hooks === "undefined"
          ? {
              onFinished: async data => {
                await execBeforeFinished()
                context.logger.log("onFinished", data)
              },
              onError: async data => {
                context.logger.log("onError", data)
              },
              onBeforeFinished,
            }
          : {
              ...hooks,
              onFinished: async data => {
                await execBeforeFinished()
                
                context.logger.log("onFinished", data);
                hooks.onFinished(data)
              },
              onError: async message => {
                hooks.onError(message);
              },
              onBeforeFinished,
            },
    }
    return context
  }

  const getComponentRuntime = namespace => {
    const com =
      global.__comlibs_rt_?.[0].comAray.find(
        item => item.namespace === namespace,
      ) || {}
    return com.runtime || (() => {})
  }

  class WorkFLow {
    eventQueue = new Array()
    nodeMap = new Map()
    context = createContext()

    constructor() {
      this.initNodeMap()
    }

    // 初始化所有节点
    initNodeMap() {
            // mybricks.domain.select
      this.nodeMap.set("u_IFUCs", new FlowNode({
            id: "u_IFUCs",
            inputKeys: ["params"],
            runner: getComponentRuntime("mybricks.domain.select"),
          data: {"autoRun":false,"selector":{"whereJoiner":"and","conditions":{"fieldId":1678520569777,"fieldName":"条件组","whereJoiner":"AND","conditions":[],"operator":"="},"entities":[{"id":"SYS_USER","isSystem":true,"name":"系统用户","fieldAry":[{"id":"F_JAHSI","isPrimaryKey":true,"name":"id","desc":"主键","dbType":"bigint","bizType":"number","typeLabel":"数字","selected":false},{"id":"F_EQ0OO","isPrivate":true,"name":"_STATUS_DELETED","desc":"是否已删除","dbType":"int","bizType":"number","typeLabel":"数字","selected":false},{"id":"F_MULYJ","isPrivate":true,"name":"_CREATE_USER_ID","desc":"创建者ID","dbType":"varchar","bizType":"string","typeLabel":"字符","selected":false},{"id":"F_KUCBS","isPrivate":true,"name":"_CREATE_TIME","desc":"创建时间","dbType":"bigint","bizType":"datetime","typeLabel":"日期时间","selected":false},{"id":"F_F_VLX","isPrivate":true,"name":"_UPDATE_USER_ID","desc":"更新者ID","dbType":"varchar","bizType":"int","typeLabel":"数字","selected":false},{"id":"F_MGDW_","isPrivate":true,"name":"_UPDATE_TIME","desc":"最后更新时间","dbType":"bigint","bizType":"datetime","typeLabel":"日期时间","selected":false},{"id":"F_X3OWW","name":"名称","dbType":"varchar","bizType":"string","typeLabel":"字符","selected":false}],"selected":false},{"id":"E_MOYGY","name":"姓名","fieldAry":[{"id":"F_TBHDS","isPrimaryKey":true,"name":"id","desc":"主键","dbType":"bigint","bizType":"number","typeLabel":"数字","selected":true},{"id":"F_D1RSN","isPrivate":true,"name":"_STATUS_DELETED","desc":"是否已删除","dbType":"int","bizType":"number","typeLabel":"数字","selected":false},{"id":"F_VY_RE","isPrivate":true,"name":"_CREATE_USER_ID","desc":"创建者ID","dbType":"varchar","bizType":"string","typeLabel":"字符","selected":false},{"id":"F_KGCKZ","isPrivate":true,"name":"_CREATE_TIME","desc":"创建时间","dbType":"bigint","bizType":"datetime","typeLabel":"日期时间","selected":false},{"id":"F_34I1F","isPrivate":true,"name":"_UPDATE_USER_ID","desc":"更新者ID","dbType":"varchar","bizType":"int","typeLabel":"数字","selected":false},{"id":"F_WMZBL","isPrivate":true,"name":"_UPDATE_TIME","desc":"最后更新时间","dbType":"bigint","bizType":"datetime","typeLabel":"日期时间","selected":false},{"id":"F_7_8UK","name":"字段0","dbType":"varchar","bizType":"string","typeLabel":"字符","selected":true}],"selected":true}],"limit":{"type":"ENUM","value":100},"pageIndex":"","orders":[],"script":"%0A%09%09%09async%20(params%2C%20executeSql)%3D%3E%7B%0A%09%09%09%09const%20FORMAT_MAP%20%3D%20%7B%0A%09%09%09%09%09formatTime%3A%20function(e%2Ct)%7Bif(null%3D%3De)return%22%22%3Bvar%20n%3Dfunction(e)%7Breturn%20e%3C10%3F%220%22%2Be%3Ae%7D%2Cr%3De.getFullYear()%2Ci%3Dr.toString().substring(2)%2Co%3De.getMonth()%2B1%2Ca%3Dn(o)%2Cc%3De.getDate()%2Cl%3Dn(c)%2Cs%3De.getHours()%2Cd%3Dn(s)%2Cu%3De.getMinutes()%2Cf%3Dn(u)%2Ch%3De.getSeconds()%2Cp%3Dn(h)%3Breturn%20t.replace(%2Fyyyy%2Fg%2Cr).replace(%2Fyy%2Fg%2Ci).replace(%2FMM%2Fg%2Ca).replace(%2FM%2Fg%2Co).replace(%2FDD%2Fg%2Cl).replace(%2FD%2Fg%2Cc).replace(%2FHH%2Fg%2Cd).replace(%2FH%2Fg%2Cs).replace(%2Fmm%2Fg%2Cf).replace(%2Fm%2Fg%2Cu).replace(%2Fss%2Fg%2Cp).replace(%2Fs%2Fg%2Ch)%7D%2C%0A%09%09%09%09%7D%3B%0A%09%09%09%09const%20spliceSelectSQLByConditions%20%3D%20function(e%2Ct)%7Bvar%20n%3Dfunction(e%2Ct)%7Bswitch(e)%7Bcase%22varchar%22%3Acase%22mediumtext%22%3Areturn'%22'%2Bt%2B'%22'%3Bdefault%3Areturn%20t%7D%7D%2Cr%3De.conditions%2Ci%3De.entities%2Co%3De.params%2Ca%3De.limit%2Cc%3De.orders%2Cl%3De.pageIndex%2Cs%3D%7B%7D%3Bi.forEach((function(e)%7Breturn%20s%5Be.id%5D%3De%7D))%3Bvar%20d%3Di.find((function(e)%7Breturn%20e.selected%7D))%3Bif(d%26%26d.fieldAry.length)%7Bvar%20u%3D%5B%5D%2Cf%3D%5B%5D%2Ch%3D%5Bd.name%5D%3Bc%3Dc.filter((function(e)%7Breturn%20e.fieldId%7D))%3Bvar%20p%3Dd.fieldAry.filter((function(e)%7Bvar%20t%2Cn%2Cr%3Breturn%20e.selected%26%26(null%3D%3D%3D(r%3Dnull%3D%3D%3D(n%3Dnull%3D%3D%3D(t%3De.mapping)%7C%7Cvoid%200%3D%3D%3Dt%3Fvoid%200%3At.entity)%7C%7Cvoid%200%3D%3D%3Dn%3Fvoid%200%3An.fieldAry)%7C%7Cvoid%200%3D%3D%3Dr%3Fvoid%200%3Ar.length)%26%26s%5Be.mapping.entity.id%5D%7D))%3Bif(p.forEach((function(e)%7Bvar%20t%2Cn%2Cr%2Ci%3De.mapping.entity%2Co%3DString(e.mapping.condition)%2Ca%3De.mapping.type%2Cc%3De.mapping.fieldJoiner%2Cl%3Ds%5Bi.id%5D%3Bif(r%3D%22primary%22%3D%3D%3Da%3Fnull!%3D%3D(t%3Dl.fieldAry.find((function(e)%7Breturn%20e.isPrimaryKey%7D)))%26%26void%200!%3D%3Dt%3Ft%3Anull%3Anull!%3D%3D(n%3Dl.fieldAry.find((function(e)%7Breturn%22relation%22%3D%3D%3De.bizType%26%26e.relationEntityId%3D%3D%3Dd.id%7D)))%26%26void%200!%3D%3Dn%3Fn%3Anull)%7Bvar%20u%3Do.startsWith(%22max(%22)%26%26o.endsWith(%22)%22)%2Cf%3D%22%22%3Bif(%22primary%22%3D%3D%3Da)%7Bif(%22-1%22%3D%3D%3Do)%7Bvar%20p%3Dd.fieldAry.find((function(e)%7Breturn%5B%22relation%22%2C%22SYS_USER%22%2C%22SYS_USER.CREATOR%22%2C%22SYS_USER.UPDATER%22%5D.includes(e.bizType)%26%26e.relationEntityId%3D%3D%3Dl.id%7D))%2Cm%3Di.fieldAry.filter((function(e)%7Breturn!e.isPrimaryKey%7D)).map((function(e)%7Breturn%20e.name%7D)).join(%22%2C%20%22)%3Bf%3D%22LEFT%20JOIN%20(SELECT%20id%20AS%20MAPPING_%22%2Be.name%2B%22_id%22%2B(m%3F%22%2C%20%22%2Bm%3A%22%22)%2B%22%20FROM%20%22%2Bl.name%2B%22%20WHERE%20_STATUS_DELETED%20%3D%200)%20MAPPING_%22%2Be.name%2B%22%20ON%20MAPPING_%22%2Be.name%2B%22.MAPPING_%22%2Be.name%2B%22_id%20%3D%20%22%2Bd.name%2B%22.%22%2B(null%3D%3Dp%3Fvoid%200%3Ap.name)%7D%7Delse%20if(%22-1%22%3D%3D%3Do)m%3Di.fieldAry.filter((function(e)%7Breturn!e.isPrimaryKey%26%26e.name!%3D%3D(null%3D%3Dr%3Fvoid%200%3Ar.name)%7D)).map((function(e)%7Breturn%22GROUP_CONCAT(%22%2Be.name%2B'%20SEPARATOR%20%22'%2Bc%2B'%22)%20'%2Be.name%7D)).join(%22%2C%20%22)%2Cf%3D%22LEFT%20JOIN%20(SELECT%20id%20AS%20MAPPING_%22%2Be.name%2B%22_id%2C%20%22%2Br.name%2B(m%3F%22%2C%20%22%2Bm%3A%22%22)%2B%22%20FROM%20%22%2Bl.name%2B%22%20WHERE%20_STATUS_DELETED%20%3D%200%20GROUP%20BY%20%22%2Br.name%2B%22)%20MAPPING_%22%2Be.name%2B%22%20ON%20MAPPING_%22%2Be.name%2B%22.%22%2Br.name%2B%22%20%3D%20%22%2Bd.name%2B%22.id%22%3Belse%20if(u)%7Bvar%20v%3Do.substr(4%2Co.length-5)%3Bm%3Di.fieldAry.filter((function(e)%7Breturn!e.isPrimaryKey%26%26e.name!%3D%3D(null%3D%3Dr%3Fvoid%200%3Ar.name)%7D)).map((function(e)%7Breturn%20e.name%7D)).join(%22%2C%20%22)%2Cf%3D%22LEFT%20JOIN%20(SELECT%20id%20AS%20MAPPING_%22%2Be.name%2B%22_id%2C%20%22%2Br.name%2B(m%3F%22%2C%20%22%2Bm%3A%22%22)%2B%22%20FROM%20%22%2Bl.name%2B%22%20WHERE%20_STATUS_DELETED%20%3D%200%20AND%20%22%2Bv%2B%22%20IN%20(SELECT%20max(%22%2Bv%2B%22)%20FROM%20%22%2Bl.name%2B%22%20WHERE%20_STATUS_DELETED%20%3D%200%20GROUP%20BY%20%22%2Br.name%2B%22))%20MAPPING_%22%2Be.name%2B%22%20ON%20MAPPING_%22%2Be.name%2B%22.%22%2Br.name%2B%22%20%3D%20%22%2Bd.name%2B%22.id%22%7Dh.push(f)%7D%7D))%2Cf.push.apply(f%2Cd.fieldAry.filter((function(e)%7Breturn%22mapping%22!%3D%3De.bizType%26%26e.selected%7D)).map((function(e)%7Breturn%20d.name%2B%22.%22%2Be.name%7D)))%2Cp.forEach((function(e)%7Bvar%20t%3De.mapping.entity%3Bf.push.apply(f%2Ct.fieldAry.map((function(t)%7Breturn%20t.isPrimaryKey%3F%22MAPPING_%22%2Be.name%2B%22.MAPPING_%22%2Be.name%2B'_id%20AS%20%22'%2Be.name%2B%22_%22%2Bt.name%2B'%22'%3A%22MAPPING_%22%2Be.name%2B%22.%22%2Bt.name%2B'%20AS%20%22'%2Be.name%2B%22_%22%2Bt.name%2B'%22'%7D)))%7D))%2Cu.push(%22SELECT%20%22%2Bf.join(%22%2C%20%22)%2B%22%20FROM%20%22%2Bh.join(%22%20%22))%2Cu.push(function%20e(t%2Cr)%7Bvar%20i%3Dt.conditions%2Co%3Dt.entities%2Ca%3Dt.params%2Cc%3Dt.whereJoiner%2Cl%3Dt.entityMap%2Cs%3Dt.curEntity%2Cd%3Di.filter((function(e)%7Breturn%20e.fieldId%7D)).filter((function(e)%7Bvar%20t%2Cn%3Bif(e.conditions)return!0%3Bif(!(null%3D%3D%3D(t%3De.value)%7C%7Cvoid%200%3D%3D%3Dt%3Fvoid%200%3At.startsWith(%22%7B%22))%7C%7C!(null%3D%3D%3D(n%3De.value)%7C%7Cvoid%200%3D%3D%3Dn%3Fvoid%200%3An.endsWith(%22%7D%22)))return%20void%200!%3D%3D(null%3D%3De%3Fvoid%200%3Ae.value)%3Bvar%20r%3De.value.substr(1%2Ce.value.length-2)%3Breturn!!new%20RegExp(%22%5E%22%2Bo.map((function(e)%7Breturn%20e.name%7D)).join(%22%7C%22)%2B%22%5C%5C.%22).test(r)%7C%7Cvoid%200!%3D%3Da%5Br.substring(r.indexOf(%22.%22)%2B1)%5D%7D))%2Cu%3D%5B%5D%3Bd.forEach((function(t)%7Bvar%20i%2Cc%2Cd%2Cf%2Ch%2Cp%3D%22%22%3Bif(t.conditions)p%3De(%7Bconditions%3At.conditions%2Centities%3Ao%2CwhereJoiner%3At.whereJoiner%2Cparams%3Aa%2CentityMap%3Al%2CcurEntity%3As%7D%2Cr)%3Belse%7Bvar%20m%3Dl%5Bt.entityId%5D%2Cv%3Dnull%3D%3Dm%3Fvoid%200%3Am.fieldAry.find((function(e)%7Breturn%20e.id%3D%3D%3Dt.fieldId%7D))%3Bif(v)%7Bvar%20g%3Ds.name%2B%22.%22%2Bv.name%3Bif(m.id!%3D%3Ds.id)%7Bvar%20y%3Ds.fieldAry.find((function(e)%7Bvar%20n%2Cr%3Breturn(null%3D%3D%3D(r%3Dnull%3D%3D%3D(n%3De.mapping)%7C%7Cvoid%200%3D%3D%3Dn%3Fvoid%200%3An.entity)%7C%7Cvoid%200%3D%3D%3Dr%3Fvoid%200%3Ar.id)%3D%3D%3Dt.entityId%7D))%2Cb%3Dnull%3D%3D%3D(c%3Dnull%3D%3D%3D(i%3Dnull%3D%3Dy%3Fvoid%200%3Ay.mapping)%7C%7Cvoid%200%3D%3D%3Di%3Fvoid%200%3Ai.entity)%7C%7Cvoid%200%3D%3D%3Dc%3Fvoid%200%3Ac.fieldAry.find((function(e)%7Breturn%20e.id%3D%3D%3Dt.fieldId%7D))%3Bg%3D%22MAPPING_%22%2B((null%3D%3Dy%3Fvoid%200%3Ay.name)%7C%7Cm.name)%2B((null%3D%3Db%3Fvoid%200%3Ab.isPrimaryKey)%3F%22.MAPPING_%22%2B((null%3D%3Dy%3Fvoid%200%3Ay.name)%7C%7Cm.name)%2B%22_%22%3A%22.%22)%2B((null%3D%3Db%3Fvoid%200%3Ab.name)%7C%7Cv.name)%7Dvar%20x%3Dt.value%7C%7C%22%22%2Cw%3D!1%3Bif(t.value.startsWith(%22%7B%22)%26%26t.value.endsWith(%22%7D%22))%7Bvar%20_%3Dt.value.substr(1%2Ct.value.length-2)%3Bnew%20RegExp(%22%5E%22%2Bo.map((function(e)%7Breturn%20e.name%7D)).join(%22%7C%22)%2B%22%5C%5C.%22).test(_)%3F(x%3D_%2Cw%3D!0)%3Ax%3Dr%3F%22%24%7Bparams.%22%2B_.substring(_.indexOf(%22.%22)%2B1)%2B%22%7D%22%3Aa%5B_.substring(_.indexOf(%22.%22)%2B1)%5D%7Dp%3Dg%2B%22%20%22%2Bt.operator%2B%22%20%22%2B(w%3Fx%3A(d%3Dv.dbType%2Ch%3Dx%2C%22LIKE%22%3D%3D%3D(f%3Dt.operator)%7C%7C%22NOT%20LIKE%22%3D%3D%3Df%3F'%22%25'%2Bh%2B'%25%22'%3A%22IN%22%3D%3D%3Df%7C%7C%22NOT%20IN%22%3D%3D%3Df%3F%22(%22%2Bh.split(%22%2C%22).map((function(e)%7Breturn%20n(d%2Ce)%7D)).join(%22%2C%22)%2B%22)%22%3An(d%2Ch)))%7D%7Dp%26%26u.push(p)%7D))%3Bvar%20f%3D(u.length%3E1%3F%22(%22%3A%22%22)%2Bu.join(%22%20%22%2Bc%2B%22%20%22)%2B(u.length%3E1%3F%22)%22%3A%22%22)%2Ch%3D%22%22%3Breturn%20c%7C%7C(h%3D%22WHERE%20_STATUS_DELETED%20%3D%200%22%2B(f%3F%22%20AND%20%22%3A%22%22))%2Ch%2Bf%7D(%7Bconditions%3A%5Br%5D%2Centities%3Ai%2Cparams%3Ao%2CentityMap%3As%2CcurEntity%3Ad%7D%2Ct))%2Cc.length)%7Bvar%20m%3D%5B%5D%3Bc.forEach((function(e)%7Bvar%20t%2Cn%2Cr%3Dp.find((function(t)%7Bvar%20n%2Cr%3Breturn(null%3D%3D%3D(r%3Dnull%3D%3D%3D(n%3Dt.mapping)%7C%7Cvoid%200%3D%3D%3Dn%3Fvoid%200%3An.entity)%7C%7Cvoid%200%3D%3D%3Dr%3Fvoid%200%3Ar.id)%3D%3D%3De.entityId%7D))%3Bif(r)%7Bvar%20i%3Dnull%3D%3D%3D(n%3Dnull%3D%3D%3D(t%3Dr.mapping)%7C%7Cvoid%200%3D%3D%3Dt%3Fvoid%200%3At.entity)%7C%7Cvoid%200%3D%3D%3Dn%3Fvoid%200%3An.fieldAry.find((function(t)%7Breturn%20t.id%3D%3D%3De.fieldId%7D))%3Bi%26%26m.push(%22MAPPING_%22%2Br.name%2B%22.%22%2B(i.isPrimaryKey%3F%22MAPPING_%22%2Br.name%2B%22_%22%3A%22%22)%2Bi.name%2B%22%20%22%2Be.order)%7Delse%7Bvar%20o%3Dd.fieldAry.find((function(t)%7Breturn%20t.id%3D%3D%3De.fieldId%7D))%3Bo%26%26m.push(d.name%2B%22.%22%2Bo.name%2B%22%20%22%2Be.order)%7D%7D))%2Cm.length%26%26u.push(%22ORDER%20BY%20%22%2Bm.join(%22%2C%20%22))%7Dvar%20v%3Da.value%3FString(a.value)%3A%22%22%3Bif(v%26%26(v.startsWith(%22%7B%22)%26%26v.endsWith(%22%7D%22)%3F(v%3Do%5Bv.slice(v.indexOf(%22.%22)%2B1%2C-1)%5D)%26%26u.push(%22LIMIT%20%22%2Bv)%3Au.push(%22LIMIT%20%22%2Bv))%2Cl)if(l.startsWith(%22%7B%22)%26%26l.endsWith(%22%7D%22))%7Bvar%20g%3Do%5Bl.slice(l.indexOf(%22.%22)%2B1%2C-1)%5D%3Bg%26%26u.push(%22OFFSET%20%22%2B(Number(g)-1)*Number(v))%7Delse%20Number.isNaN(Number(l))%7C%7Cu.push(%22OFFSET%20%22%2B(Number(l)-1)*Number(v))%3Breturn%20u.join(%22%20%22)%7D%7D%3B%0A%09%09%09%09%0A%09%09%09%09const%20sql%20%3D%20spliceSelectSQLByConditions(%7B%0A%09%09%09%09%09params%3A%20params%20%7C%7C%20%7B%7D%2C%0A%09%09%09%09%09conditions%3A%20%7B%22fieldId%22%3A1678520569777%2C%22fieldName%22%3A%22%E6%9D%A1%E4%BB%B6%E7%BB%84%22%2C%22whereJoiner%22%3A%22AND%22%2C%22conditions%22%3A%5B%5D%2C%22operator%22%3A%22%3D%22%7D%20%7C%7C%20%5B%5D%2C%0A%09%09%09%09%09entities%3A%20%5B%7B%22id%22%3A%22SYS_USER%22%2C%22isSystem%22%3Atrue%2C%22name%22%3A%22%E7%B3%BB%E7%BB%9F%E7%94%A8%E6%88%B7%22%2C%22fieldAry%22%3A%5B%7B%22id%22%3A%22F_JAHSI%22%2C%22isPrimaryKey%22%3Atrue%2C%22name%22%3A%22id%22%2C%22desc%22%3A%22%E4%B8%BB%E9%94%AE%22%2C%22dbType%22%3A%22bigint%22%2C%22bizType%22%3A%22number%22%2C%22typeLabel%22%3A%22%E6%95%B0%E5%AD%97%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_EQ0OO%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_STATUS_DELETED%22%2C%22desc%22%3A%22%E6%98%AF%E5%90%A6%E5%B7%B2%E5%88%A0%E9%99%A4%22%2C%22dbType%22%3A%22int%22%2C%22bizType%22%3A%22number%22%2C%22typeLabel%22%3A%22%E6%95%B0%E5%AD%97%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_MULYJ%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_CREATE_USER_ID%22%2C%22desc%22%3A%22%E5%88%9B%E5%BB%BA%E8%80%85ID%22%2C%22dbType%22%3A%22varchar%22%2C%22bizType%22%3A%22string%22%2C%22typeLabel%22%3A%22%E5%AD%97%E7%AC%A6%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_KUCBS%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_CREATE_TIME%22%2C%22desc%22%3A%22%E5%88%9B%E5%BB%BA%E6%97%B6%E9%97%B4%22%2C%22dbType%22%3A%22bigint%22%2C%22bizType%22%3A%22datetime%22%2C%22typeLabel%22%3A%22%E6%97%A5%E6%9C%9F%E6%97%B6%E9%97%B4%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_F_VLX%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_UPDATE_USER_ID%22%2C%22desc%22%3A%22%E6%9B%B4%E6%96%B0%E8%80%85ID%22%2C%22dbType%22%3A%22varchar%22%2C%22bizType%22%3A%22int%22%2C%22typeLabel%22%3A%22%E6%95%B0%E5%AD%97%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_MGDW_%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_UPDATE_TIME%22%2C%22desc%22%3A%22%E6%9C%80%E5%90%8E%E6%9B%B4%E6%96%B0%E6%97%B6%E9%97%B4%22%2C%22dbType%22%3A%22bigint%22%2C%22bizType%22%3A%22datetime%22%2C%22typeLabel%22%3A%22%E6%97%A5%E6%9C%9F%E6%97%B6%E9%97%B4%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_X3OWW%22%2C%22name%22%3A%22%E5%90%8D%E7%A7%B0%22%2C%22dbType%22%3A%22varchar%22%2C%22bizType%22%3A%22string%22%2C%22typeLabel%22%3A%22%E5%AD%97%E7%AC%A6%22%2C%22selected%22%3Afalse%7D%5D%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22E_MOYGY%22%2C%22name%22%3A%22%E5%A7%93%E5%90%8D%22%2C%22fieldAry%22%3A%5B%7B%22id%22%3A%22F_TBHDS%22%2C%22isPrimaryKey%22%3Atrue%2C%22name%22%3A%22id%22%2C%22desc%22%3A%22%E4%B8%BB%E9%94%AE%22%2C%22dbType%22%3A%22bigint%22%2C%22bizType%22%3A%22number%22%2C%22typeLabel%22%3A%22%E6%95%B0%E5%AD%97%22%2C%22selected%22%3Atrue%7D%2C%7B%22id%22%3A%22F_D1RSN%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_STATUS_DELETED%22%2C%22desc%22%3A%22%E6%98%AF%E5%90%A6%E5%B7%B2%E5%88%A0%E9%99%A4%22%2C%22dbType%22%3A%22int%22%2C%22bizType%22%3A%22number%22%2C%22typeLabel%22%3A%22%E6%95%B0%E5%AD%97%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_VY_RE%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_CREATE_USER_ID%22%2C%22desc%22%3A%22%E5%88%9B%E5%BB%BA%E8%80%85ID%22%2C%22dbType%22%3A%22varchar%22%2C%22bizType%22%3A%22string%22%2C%22typeLabel%22%3A%22%E5%AD%97%E7%AC%A6%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_KGCKZ%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_CREATE_TIME%22%2C%22desc%22%3A%22%E5%88%9B%E5%BB%BA%E6%97%B6%E9%97%B4%22%2C%22dbType%22%3A%22bigint%22%2C%22bizType%22%3A%22datetime%22%2C%22typeLabel%22%3A%22%E6%97%A5%E6%9C%9F%E6%97%B6%E9%97%B4%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_34I1F%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_UPDATE_USER_ID%22%2C%22desc%22%3A%22%E6%9B%B4%E6%96%B0%E8%80%85ID%22%2C%22dbType%22%3A%22varchar%22%2C%22bizType%22%3A%22int%22%2C%22typeLabel%22%3A%22%E6%95%B0%E5%AD%97%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_WMZBL%22%2C%22isPrivate%22%3Atrue%2C%22name%22%3A%22_UPDATE_TIME%22%2C%22desc%22%3A%22%E6%9C%80%E5%90%8E%E6%9B%B4%E6%96%B0%E6%97%B6%E9%97%B4%22%2C%22dbType%22%3A%22bigint%22%2C%22bizType%22%3A%22datetime%22%2C%22typeLabel%22%3A%22%E6%97%A5%E6%9C%9F%E6%97%B6%E9%97%B4%22%2C%22selected%22%3Afalse%7D%2C%7B%22id%22%3A%22F_7_8UK%22%2C%22name%22%3A%22%E5%AD%97%E6%AE%B50%22%2C%22dbType%22%3A%22varchar%22%2C%22bizType%22%3A%22string%22%2C%22typeLabel%22%3A%22%E5%AD%97%E7%AC%A6%22%2C%22selected%22%3Atrue%7D%5D%2C%22selected%22%3Atrue%7D%5D%2C%0A%09%09%09%09%09limit%3A%20%7B%22type%22%3A%22ENUM%22%2C%22value%22%3A100%7D%2C%0A%09%09%09%09%09orders%3A%20%5B%5D%2C%0A%09%09%09%09%09pageIndex%3A%20%22%22%2C%0A%09%09%09%09%7D)%3B%0A%09%09%09%09%0A%09%09%09%09let%20%7B%20rows%20%7D%20%3D%20await%20executeSql(sql)%3B%0A%09%09%09%09%0A%09%09%09%09%0A%09%09rows%20%3D%20Array.from(rows%20%7C%7C%20%5B%5D).map(item%20%3D%3E%20%7B%0A%09%09%09Object.keys(item).forEach(key%20%3D%3E%20%7B%0A%09%09%09%09%0A%09%09%09%7D)%3B%0A%09%09%09%0A%09%09%09%0A%09%09%09%0A%09%09%09return%20item%3B%0A%09%09%7D)%3B%0A%09%0A%09%09%09%09%0A%09%09%09%09return%20rows%3B%0A%09%09%09%7D%0A%09%09%09","desc":"姓名 的 id, 字段0"}},
          outputRelations: {"rtn":[{"name":"response","id":"u_zz2pQ"}]},
          broadcast: e => this.broadcast(e),
          context: this.context
        }))
      
      
    }

    broadcast(event) {
      this.eventQueue.push(event)
    }
    run() {
      // 添加自动运行节点
            

      // 添加开始命令
            this.eventQueue.push({ nodeId: "u_IFUCs", pinId: "params", payload: this.context.PARAMS });
      

      this.context.logger.log("task begin!")
      let event
      // 循环获取事件，直到没有其他事件
      // while (this.eventQueue.length > 0) {
      //   event = this.eventQueue.shift()
      //   // 每个节点依次处理output事件
      //   this.nodeMap.forEach(item => {
      //     item.onReceiveEvent(event)
      //   })
      // }

      const checEvent = () => {
        if (this.eventQueue.length > 0) {
          event = this.eventQueue.shift()
                    if(event.nodeId === "u_zz2pQ" && event.pinId === "response") {
              this.context.hooks.onFinished(event.payload)
              return
            }
            
          

          // 每个节点依次处理output事件
          this.nodeMap.forEach(item => {
            item.onReceiveEvent(event)
          })
        }
        if (!this.context.isExit) {
          setTimeout(checEvent, 10)
        }
      }

      checEvent()
    }
  }

  // 每个节点的类型
  class FlowNode {
    id = ""
    inputKeys = []
    context
    runner = (...args) => {}
    outputRelations = {}
    data
    broadcast // 广播方法
    // 保存接收到的数据
    inputsMap = {}

    constructor({
      id,
      inputKeys,
      runner,
      data,
      outputRelations,
      broadcast,
      context,
    }) {
      this.id = id
      this.inputKeys = inputKeys || []
      this.runner = runner
      this.context = context
      this.data = data
      this.broadcast = broadcast
      this.outputRelations = outputRelations
    }

    onReceiveEvent(e) {
      const { nodeId, pinId, payload } = e
      if (nodeId !== this.id) return
      // 添加收到的信息
      this.inputsMap[pinId] = payload

      if (this.isAllInputReceived()) {
        this.run()
        // 清空收到的input
        this.inputsMap = {}
      }
    }

    isAllInputReceived() {
      return this.inputKeys.every(key => key in this.inputsMap)
    }

    // 广播output事件
    publisOutputhEvent(outputId, payload) {
      this.outputRelations[outputId].forEach(item => {
        this.broadcast({
          nodeId: item.id,
          pinId: item.name,
          payload: payload,
        })
      })
    }

    run() {
      const inputKeys = this.inputKeys
      const inputsMap = this.inputsMap
      const outpusRelations = this.outputRelations
      const self = this
      const inputProxy = new Proxy(
        inputKeys.reduce((pre, key) => { pre[key] = ""; return pre; }, {}),
	      {
	        ownKeys(target) {
	          return Object.keys(target);
	        },
          get(target, prop, receiver) {
            const hasProp = inputKeys.indexOf(prop) !== -1;
            const aggregateProps = inputKeys.filter(key => key.startsWith(prop + "."));
            if (hasProp || aggregateProps.length) {
              if (!target[prop]) {
                if (hasProp) {
	                target[prop] = cb => {
	                  cb(inputsMap[prop]);
	                };
                } else {
	                target[prop] = cb => {
	                  cb(
	                    aggregateProps.reduce((pre, key) => {
	                      pre[key.replace(prop + ".", "")] = inputsMap[key];
	                      return pre;
	                    }, {})
	                  );
	                };
                }
              }
              return target[prop];
            } else {
              throw new Error(
                "can not find input key " + prop + " in node " + self.id
              );
            }
          },
        },
      )

      const outputProxy = new Proxy(
        {},
        {
          get(target, prop, receiver) {
            if (prop in outpusRelations) {
              if (!target[prop]) {
                target[prop] = value => {
                  self.publisOutputhEvent(prop, value)
                }
              }
              return target[prop]
            }
          },
        },
      )

      this.runner({
       data: this.data,
       inputs: inputProxy,
       outputs: outputProxy,
       context: this.context,
       env: this.context,
       onError: this.context.onError,
      });
    }
  }

  // const workflow = new WorkFLow()
  // // 稍后执行，保证node端监听hooks的回调能先注册上
  // setTimeout(() => {
  //   workflow.run()
  // }, 0)

  
  
function run() {
    return new Promise((resolve, reject) => {
        GLOBAL_RESOLVE = resolve
        GLOBAL_REJECT = reject
        new WorkFLow().run()
    })
}      
               
module.exports = {
    run
}