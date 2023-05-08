var { onFinished, onHeaders } = require('express-request-hook')
var timeConfig = require('../../timeout.json')
const timeout = function(time?, options?) {
  var opts = options || {}

  var delayConfig = Number(time || 10 * 1000)

  var respond = opts.respond === undefined || opts.respond === true

  return function (req, res, next) {
    const { url, _parsedUrl, method } = req;
    let delay = delayConfig
    const customConfig = timeConfig?.whiteList?.[_parsedUrl?.pathname + ':' + method];
    if(customConfig?.ignore === true) {
      next()
    } else if(customConfig?.timeout) {
      delay = customConfig?.timeout
    }
    let id = setTimeout(function () {
      req.expired = true
      req.emit('timeout', delay)
    }, delay)

    if (respond) {
      req.on('timeout', () => {
        res.status(200).json({
          code: -1,
          msg:'网络不佳，请稍后重试'
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