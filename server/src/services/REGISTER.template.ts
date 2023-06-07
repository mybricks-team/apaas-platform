function startExe(obj, { dbConnection, genUniqueId }) {
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
			if (!username || !password) {
				reject(Error('用户名或密码不能为空'));
			}
      const sql = `SELECT id, 用户名 FROM D_${projectId}_系统用户_VIEW WHERE _STATUS_DELETED = 0 AND 用户名 = '${username}' AND 密码 = '${password}' ORDER BY id DESC LIMIT 1;`;
      const res = await _execSQL(sql, { args: obj });
			if (res[0]) {
				reject(Error('用户已存在'));
			}
			const time = Date.now();
	    await _execSQL(
				`INSERT INTO D_${projectId}_系统用户_VIEW (id, _STATUS_DELETED, _CREATE_TIME, _UPDATE_TIME, 用户名, 密码)
 							VALUES (${genUniqueId()}, 0, ${time}, ${time}, '${username}', '${password}');`,
		    { args: obj }
	    );
	    const userRes = await _execSQL(`SELECT id, 用户名 FROM D_${projectId}_系统用户_VIEW WHERE _STATUS_DELETED = 0 AND 用户名 = '${username}' AND 密码 = '${password}' ORDER BY id DESC LIMIT 1;`, { args: obj });
			
			resolve(userRes[0]);
    }
    catch(error) {
      console.log('【执行SQL】：执行沙箱内sql出错: ' + error?.message);
      reject(error)
    }
  })
}

module.exports = { startExe };
