function startExe(obj, { dbConnection, genUniqueId }) {
  const _execSQL = async (sql, { args }) => {
    const conn = dbConnection;
    const handledSql = sql?.replace(new RegExp('(?:\n|\t|\r)', 'ig'), ($0, $1) => {
      return ' ';
    });
    return conn.exe(handledSql, args);
  };
  // userId为主键
  const { projectId, phone, password } = obj
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `SELECT id, 用户名, 电话号码, 邮箱 FROM D_${projectId}_系统用户_VIEW WHERE _STATUS_DELETED = 0 AND 电话号码 = '${phone}' ORDER BY id DESC LIMIT 1;`;
      const res = await _execSQL(sql, { args: obj });
			if (res[0]) {
				reject(Error('电话号码已被使用'));
			}
			const getValue = (key) => (obj[key] === undefined || obj[key] === null) ? 'null' : `'${obj[key]}'`;
			const time = Date.now();
	    await _execSQL(
				`INSERT INTO D_${projectId}_系统用户_VIEW (id, _STATUS_DELETED, _CREATE_TIME, _UPDATE_TIME, 注册日期, 用户名, 电话号码, 邮箱, 密码, weixinOpenid, weixinUnionid)
 							VALUES (${genUniqueId()}, 0, ${time}, ${time}, ${time}, ${getValue('username')}, ${getValue('phone')}, ${getValue('email')}, ${getValue('password')}, ${getValue('weixinOpenid')}, ${getValue('weixinUnionid')});`,
		    { args: obj }
	    );
	    const userRes = await _execSQL(`SELECT id, 用户名, 电话号码, 邮箱 FROM D_${projectId}_系统用户_VIEW WHERE _STATUS_DELETED = 0 AND 电话号码 = '${phone}' AND 密码 = '${password}' ORDER BY id DESC LIMIT 1;`, { args: obj });
			
			resolve(userRes[0]);
    }
    catch(error) {
      console.log('【执行SQL】：执行沙箱内sql出错: ' + error?.message);
      reject(error)
    }
  })
}

module.exports = { startExe };
