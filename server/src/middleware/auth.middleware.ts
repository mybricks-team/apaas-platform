export function apiAuth() {
  return async function (request, response, next) {
    if(request.url?.indexOf('/api') !== -1) {
      if(request.url === '/paas/api/user/login') {
        next()
        return
      }
      if(global?.SYSTEM_CONFIG?.interfaceAuth) {
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
