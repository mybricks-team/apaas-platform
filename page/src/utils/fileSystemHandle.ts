import { directoryOpen } from 'browser-fs-access'

async function getdir() {
  const blobs = await directoryOpen({ recursive: false, id: 'projects', mode: 'readwrite' });

  const str = blobs[0].directoryHandle

  return str
}

// function openIndexDB() {
//   let db
//   const request = window.indexedDB.open('mybricks-studio')

//   request.onsuccess = function (event) {
//     db = request.result;
//     console.log('数据库打开成功');
//   }

//   request.onupgradeneeded = function (event) {
//     db = event.target.result;
//     let objectStore

//     if (!db.objectStoreNames.contains('native-file-handles')) {
//       objectStore = db.createObjectStore('native-file-handles', { keyPath: 'id' });
//     }
//   }
// }

// class MyBricksStudioDB {
//   db: any

//   constructor() {
//     const request = window.indexedDB.open('mybricks-studio')

//     request.onsuccess = function (event) {
//       this.db = request.result;
//       console.log('数据库打开成功');
//     }

//     request.onupgradeneeded = function (event) {
//       this.db = event.target.result;
//       let objectStore

//       if (!this.db.objectStoreNames.contains('native-file-handles')) {
//         objectStore = this.db.createObjectStore('native-file-handles', { keyPath: 'id' });
//       }
//     }
//   }

//   add(params) {
//     const request = this.db.transaction(['native-file-handles'], 'readwrite')
//       .objectStore('native-file-handles')
//       .add(params)

//     request.onsuccess = function (event) {
//       console.log('数据写入成功');
//     };

//     request.onerror = function (event) {
//       console.log('数据写入失败');
//     }
//     return request
//   }
// }

export {
  getdir
}