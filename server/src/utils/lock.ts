const env = require('../../env.js')
const fs = require('fs');

const lockUpgrade = async () => {
  return new Promise(async (resolve, reject) => {
    fs.open(env.FILE_UPGRADE_LOCK_FILE, 'wx', (err, fd) => {
      if (err) {
        const birthtimeMs = fs.statSync(env.FILE_UPGRADE_LOCK_FILE).birthtimeMs
        if(Date.now() - birthtimeMs > 5 * 60 * 1000) {
          // 如果五分钟直接解锁
          fs.unlinkSync(env.FILE_UPGRADE_LOCK_FILE)
          console.log('超过五分钟直接解锁')
          resolve(fd)
          return
        }
        // 加锁失败，执行回调函数
        reject(err)
        return
      } else {
        resolve(fd)
      }
    });
  })
}

const unLockUpgrade = async (param: { fd?: any, force: boolean }) => {
  return new Promise((resolve, reject) => {
    const { fd, force = true } = param
    if(force) {
      fs.unlink(env.FILE_UPGRADE_LOCK_FILE, (err) => {
        if(err) {
          reject(new Error('强制解锁失败'))
        }
        resolve(true)
      })
    } else {
      fs.close(fd, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    }
  })
}

export {
  lockUpgrade,
  unLockUpgrade
}