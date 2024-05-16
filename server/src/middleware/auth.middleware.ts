export function apiAuth({ configDao }) {
  return async function (request, response, next) {
    if(request.url?.indexOf('/api') !== -1) {
      if(request.url === '/paas/api/user/login' || request.url === '/paas/api/user/queryCurrentSession') {
        next()
        return
      }
      const config = (await configDao.getConfig({ namespace: ['system'] }))?.[0];
      if(config?.config?.interfaceAuth) {
        if(request.headers?.cookie?.indexOf('HAINIU_UserInfo') !== -1) {
          next()
          return
        } else {
          response.status(401).json({
            code: -1,
            msg: '未授权，请先登录'
          })
          return
        }
      }
    }
    next();
  };
}
