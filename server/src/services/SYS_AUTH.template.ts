function startExe(obj, { dbConnection }) {
  const _execSQL = async (sql, { args }) => {
    const conn = dbConnection;
    const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
      return ' ';
    });
    return conn.exe(handledSql, args);
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
