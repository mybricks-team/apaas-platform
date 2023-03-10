const { parentPort } = require("worker_threads");
let DB_CONN = null;
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
            parentPort.postMessage(safeStringify({
                action: `TASK_MSG`,
                taskId: taskId,
                data: args,
            }));
        },
        error: (...args) => {
            parentPort.postMessage(safeStringify({
                action: `TASK_MSG`,
                taskId: taskId,
                data: args,
            }));
        },
    };
};
const Hooks = (taskId) => {
    return {
      onFinished: (data) => {
            parentPort.postMessage(safeStringify({
                action: `TASK_DONE`,
                taskId,
                data: data,
            }));
        },
        onError: (msg) => {
            parentPort.postMessage(safeStringify({
                action: `TASK_ERROR`,
                taskId,
                data: msg,
            }));
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
function run() {
  return new Promise((resolve, reject) => {
    Util.execSQL('SELECT D_318_会员标签表_VIEW.id, D_318_会员标签表_VIEW.标签名称, D_318_会员标签表_VIEW.说明, D_318_会员标签表_VIEW.发布者, D_318_会员标签表_VIEW.发布时间, MAPPING_发布者.MAPPING_发布者_id AS "发布者_id", MAPPING_发布者.名称 AS "发布者_名称" FROM D_318_会员标签表_VIEW LEFT JOIN (SELECT id AS MAPPING_发布者_id, 名称 FROM D_318_系统用户_VIEW WHERE _STATUS_DELETED = 0) MAPPING_发布者 ON MAPPING_发布者.MAPPING_发布者_id = D_318_会员标签表_VIEW.发布者 WHERE _STATUS_DELETED = 0 AND (D_318_会员标签表_VIEW.id LIKE "%%" OR D_318_会员标签表_VIEW.标签名称 LIKE "%%" OR D_318_会员标签表_VIEW.说明 LIKE "%%" OR D_318_会员标签表_VIEW.发布者 LIKE "%%" OR D_318_会员标签表_VIEW.发布时间 LIKE "%%") LIMIT 50 OFFSET 0')
    // Util.execSQL('SELECT D_371_表0_VIEW.id, D_371_表0_VIEW.name FROM D_371_表0_VIEW WHERE _STATUS_DELETED = 0 LIMIT 100')
    .then((res) => {
        console.log('数据是', JSON.stringify(res))
        resolve(res)
      })
  })
}
               
module.exports = {
    run
}