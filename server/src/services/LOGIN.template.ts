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
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `SELECT id, 用户名 FROM D_${projectId}_系统用户_VIEW WHERE _STATUS_DELETED = 0 AND 用户名 = '${username}' AND 密码 = '${password}' ORDER BY id DESC LIMIT 1;`;
      const res = await _execSQL(sql, { args: obj });
      const user = res[0];

      if (!user) {
        resolve(undefined);
      } else {
        const authRes = await _execSQL(`SELECT 角色名 FROM D_${projectId}_系统权限关系_VIEW LEFT JOIN D_${projectId}_系统权限_VIEW ON D_${projectId}_系统权限关系_VIEW.系统权限 = D_${projectId}_系统权限_VIEW.id WHERE 系统用户 = ${user.id} ORDER BY id DESC LIMIT 1;`, { args: obj });

        user.角色权限 = authRes[0];
        resolve(user);
      }
    } catch(error) {
      console.log('【执行SQL】：执行沙箱内sql出错: ' + error?.message);
      reject(error)
    }
  })
}

module.exports = { startExe };
