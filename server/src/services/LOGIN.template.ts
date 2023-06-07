function startExe(obj, { dbConnection }) {
  const _execSQL = async (sql, { args }) => {
    const conn = dbConnection;
    const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
      return ' ';
    });
    return conn.exe(handledSql, args);
  };
  // userId为主键
  const { projectId, username, password } = obj
  return new Promise((resolve, reject) => {
    try {
      const sql = `SELECT id, 用户名 FROM D_${projectId}_系统用户_VIEW WHERE _STATUS_DELETED = 0 AND 用户名 = '${username}' AND 密码 = '${password}' ORDER BY id DESC LIMIT 1;`;
      _execSQL(sql, { args: obj }).then(res => {
        resolve(res[0]);
      })
    }
    catch(error) {
      console.log('【执行SQL】：执行沙箱内sql出错: ' + error?.message);
      reject(error)
    }
  })
}

module.exports = { startExe };
