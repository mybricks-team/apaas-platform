const DOMAIN_EXE_CODE_TEMPLATE = `
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
      const handledSql = sql?.replace(new RegExp('(?:\\n|\\t|\\r)', 'ig'), ($0, $1) => {
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
                  console.log('【执行SQL】：【' + tdId + '】: Transaction failed：' + _e?.message);
                  reject(_e);
              }
              console.log('【执行SQL】：【' + tdId + '】:  Transaction start');
              try {
                  conn.query(param, args, function (error, results) {
                      if (error) {
                          console.log('【执行SQL】：【' + tdId + '】：执行业务SQL失败：' + _e?.message);
                          conn.rollback(function () {
                            console.log('【执行SQL】：【' + tdId + '】:  Transaction rollback');
                          });
                          reject(error);
                      }
                      conn.commit(function (err) {
                          if (err) {
                              conn.rollback(function () {
                                console.log('【执行SQL】：【' + tdId + '】:  Transaction rollback');
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
                      console.log('【执行SQL】：【' + tdId + '】：Transaction Query Failed: Connection Released');
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
          GLOBAL_REJECT(msg)
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
                      console.log('【执行SQL】：执行沙箱内sql出错: '+ error?.message);
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
`

export {
  DOMAIN_EXE_CODE_TEMPLATE
}