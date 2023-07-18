var { onFinished, onHeaders } = require('express-request-hook')

const timeout = function(time?, options?) {
  var opts = options || {}

  var delay = Number(time || 10 * 1000)

  var respond = opts.respond === undefined || opts.respond === true

  return function (req, res, next) {
    let id = setTimeout(function () {
      req.expired = true
      req.emit('timeout', delay)
    }, delay)

    if (respond) {
      req.on('timeout', () => {
        res.status(200).json({
          code: 10001,
          msg: '接口超时，请确认网络连接情况'
        })
      })
    }

    req.clearTimeout = function () {
      clearTimeout(id)
      id = null
    }
    req.expired = false

    onFinished(res, function () {
      clearTimeout(id)
    })

    onHeaders(res, function () {
      clearTimeout(id)
    })

    next()
  }
}

export { 
  timeout
}