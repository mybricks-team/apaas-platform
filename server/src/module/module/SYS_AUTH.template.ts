
function startExe(obj, { dbConnection }) {
  const _execSQL = async (sql, { args }) => {
    const conn = dbConnection;
    const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
      return ' ';
    });
    let param = {
      sql: handledSql,
      timeout: 10 * 1000,
    };
    if(args) {
      param["values"] = args;
    }
    return new Promise((resolve, reject) => {
      let tdId = conn.threadId;
      conn.beginTransaction(function (_e) {
        if(_e) {
          console.log('【执行SQL】：【' + tdId + '】: Transaction failed：' + _e?.message);
          reject(_e);
        }
        console.log('【执行SQL】：【' + tdId + '】:  Transaction start');
        try {
          conn.query(param, args, function (error, results) {
            if(error) {
              console.log('【执行SQL】：【' + tdId + '】：执行业务SQL失败：' + _e?.message);
              conn.rollback(function () {
                console.log('【执行SQL】：【' + tdId + '】:  Transaction rollback');
              });
              reject(error);
            }
            conn.commit(function (err) {
              if(err) {
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
        catch(e) {
          conn.rollback(function () {
            console.log('【执行SQL】：【' + tdId + '】：Transaction Query Failed: Connection Released');
          });
          conn.release();
          reject(e);
        }
      });
    });
  };
  // userId为主键
  const { projectId, userId } = obj
  return new Promise((resolve, reject) => {
    try {
      const sql = `SELECT D_${projectId}_系统权限关系_VIEW.*, D_${projectId}_系统权限_VIEW.id AS '系统权限_id', 角色名, 角色描述, 角色权限 FROM D_${projectId}_系统权限关系_VIEW LEFT JOIN D_${projectId}_系统权限_VIEW ON D_${projectId}_系统权限关系_VIEW.系统权限 = D_${projectId}_系统权限_VIEW.id WHERE 系统用户 = ${userId} ORDER BY id DESC LIMIT 1;`;
      _execSQL(sql, { args: obj }).then(res => {
        resolve(res)
      })
    }
    catch(error) {
      console.log('【执行SQL】：执行沙箱内sql出错: ' + error?.message);
      reject(error)
    }
  })
}

module.exports = { startExe };
