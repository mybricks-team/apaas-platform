const fs = require('fs');

const lockFile = 'lock.lock';

function lock(callback) {
  // 打开文件
  fs.open(lockFile, 'wx', (err, fd) => {
    if (err) {
      if (err.code === 'EEXIST') {   // 文件已经被锁住
        console.log('文件已经被锁住', err)
      } else {
        // 加锁失败，执行回调函数
        callback(err);
      }
    } else {
      // 加锁成功，执行回调函数
      callback(null, fd);
    }
  });
}

function unlock(fd) {
  // 关闭文件
  fs.close(fd, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function deleteFile() {
  fs.unlink('/Users/andyzou/Work/registry/mybricks-team/apaas-platform/server/lock.lock', (err) => {
    if(err) {
      console.log('删除文件失败', err)
      return  
    }
    console.log('删除文件成功')
  })
}

// 使用示例
lock((err, fd) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('lock succeed', fd);
  // setTimeout(() => {
  //   unlock(fd);   // 5秒后释放锁
  // }, 5000);
});