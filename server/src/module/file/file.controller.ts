import FileContentDao from "../../dao/FileContentDao";
import FileDao from "../../dao/FileDao";
import UserDao from '../../dao/UserDao';
import FilePubDao from "../../dao/filePub.dao";
import FileCooperationDao from "../../dao/FileCooperationDao";
import UserGroupDao from "../../dao/UserGroupDao";
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { isNumber } from '../../utils'
const path = require('path');

@Controller("/paas/api")
export default class FileService {
  fileDao: FileDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  fileCooperationDao: FileCooperationDao;
  userDao: UserDao;
  userGroupDao: UserGroupDao;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
    this.fileCooperationDao = new FileCooperationDao();
    this.userDao = new UserDao();
    this.userGroupDao = new UserGroupDao();
  }

  @Get("/file/get")
  async getAll(@Query() query) {
    const {
      id,
      extName,
      page,
      pageSize = 10,
      parentId,
      creatorId,
    } = query ?? {};
    const files = await this.fileDao.query({
      id,
      extName,
      page,
      pageSize,
      parentId,
      creatorId,
    });
    return {
      code: 1,
      data: files,
    };
  }

  @Post("/file/rename")
  async rename(
    @Body("id") id: number,
    @Body("name") name: string,
    @Body("userId") userId: string,
  ) {
    const user = await this.userDao.queryByEmail({email: userId})
    const result = await this.fileDao.update({id, name, updatorId: user.email, updatorName: user.name || user.email})

    return {
      code: 1,
      data: result
    }
  }

  @Get("/file/getSysTemFiles")
  async getSysTemFiles(@Query() query) {
    const { extName, name, creatorId } = query ?? {};
    const files = await this.fileDao.getFiles({
      type: "system",
      extName,
      name,
      creatorId,
    });
    return {
      code: 1,
      data: files,
    };
  }

  @Post("/file/getFileContentByFileIdAndPubVersion")
  async getFileContentByFileIdAndPubVersion(
    @Body("fileId") fileId: string,
    @Body("pubVersion") pubVersion: string
  ) {
    if (!fileId || !pubVersion) {
      return {
        code: -1,
        msg: "参数不合法",
      };
    }
    const pubInfo = await this.filePubDao.getPublishByFileIdAndVersion({
      fileId: fileId,
      version: pubVersion,
    });
    if (!pubInfo?.fileContentId) {
      return {
        code: -1,
        msg: `filePub中fileContentId为空`,
      };
    }
    const rtn = await this.fileContentDao.queryById({
      id: pubInfo?.fileContentId,
    });
    return {
      code: 1,
      data: rtn ? rtn[0] : null,
    };
  }

  @Get("/file/getCooperationUsers")
  async getCooperationUsers(@Query() query) {
    const { userId, timeInterval } = query;
    const fileId = Number(query.fileId);

    if (!isNumber(fileId) || !userId) {
      return {
        code: -1,
        data: null,
        message: '参数fileId或userId不合法'
      }
    }

    /** 删除超时用户，status设置为-1 */
    await this.fileCooperationDao.delete({fileId, timeInterval})

    /** 查userId是否在当前fileId协作过 */
    let [curUser, numberOfOnlineUsers] = await Promise.all([
      await this.fileCooperationDao.query({userId, fileId}),
      await this.fileCooperationDao.numberOfOnlineUsers({fileId})
    ])
    // const hasUser = !!numberOfOnlineUsers
    let finalStatus: -1 | 0 | 1 = 0

    // TODO 权限上线后再开放
    // if (!hasUser) {
    //   /** 没有在线用户，默认设置status为1 */
    //   finalStatus = 1
    // }

    if (curUser) {
      /**
       * 是，更新状态
       *  已在线，状态不变
       *  未在线，状态使用finalStatus
       */
      const curStatus = curUser.status;
      await this.fileCooperationDao.update({userId, fileId, status: curStatus === -1 ? finalStatus : curStatus})
    } else {
      /** 否，插入一条status为finalStatus的记录 */
      await this.fileCooperationDao.create({userId, fileId, status: finalStatus})
    }

    const cooperationUsers = await this.fileCooperationDao.queryOnlineUsers({fileId})
    const curUserIndex = cooperationUsers.findIndex((cooperationUser) => cooperationUser.userId === userId)
    /** 把当前用户提前 */
    cooperationUsers[0] = cooperationUsers.splice(curUserIndex, 1, cooperationUsers[0])[0]

    const userIds = cooperationUsers.map((cooperationUser) => cooperationUser.userId)
    /** 查询用户信息 */
    const users = await this.userDao.queryByEmails({emails: userIds})

    return {
      code: 1,
      data: cooperationUsers.map((cooperationUser, index) => {
        return {
          ...cooperationUser,
          ...users[index]
        }
      })
    }
  }

  @Get("/file/checkInFolderProject")
  async checkInFolderProject(@Query() query) {
    const { id } = query
    let file = await this.fileDao.queryById(id)
    let inFolderProject = false

    if (!file) {
      return {
        code: 1,
        data: {
          inFolderProject
        }
      }
    }

    let { parentId } = file

    while(parentId) {
      file = await this.fileDao.queryById(parentId)

      if (file?.extName === 'folder-project') {
        inFolderProject = true
        parentId = null
      } else {
        parentId = file?.parentId
      }
    }

    return {
      code: 1,
      data: {
        inFolderProject
      }
    }
  }

  @Get("/file/getFileTreeMapByFile")
  async getFileTreeMapByFile(@Query() query) {
    const { id, extName, folderExtName } = query
    let file = await this.fileDao.queryById(id)

    if (!file) {
      return {
        code: 1,
        data: {
          ['000']: {
            data: [],
            type: '_files_',
            _origin: {}
          }
        }
      }
    }

    let { parentId } = file;

    const map = {}
    const path = []


    while(parentId) {
      file = await this.fileDao.queryById(parentId);
      const files = await this.fileDao.query({parentId: file.id, groupId: file.groupId,extNames: [extName, 'folder', 'folder-project', 'folder-module']})
      if (file.extName === folderExtName) {
        // 停止
        parentId = null
      } else {
        // 继续找
        parentId = file?.parentId
      }
      if (!parentId) {
        map['000'] = {
          data: files,
          type: '_files_',
          _origin: {}
        }
      } else {
        map[`folder_${file.id}`] = {
          data: files,
          type: '_files_',
          _origin: file
        }
        path.unshift({
          fileId: `folder_${file.id}`,
          loading: false,
          type: '_files_'
        })
      }
    }

    if (file.groupId) {
      const files = await this.fileDao.query({groupId: file.groupId,extNames: [extName, 'folder', 'folder-project', 'folder-module']})

      map['000'] = {
        data: files,
        type: '_files_',
        _origin: {}
      }
    } else {
      const files = await this.fileDao.query({extNames: [extName, 'folder', 'folder-project', 'folder-module'], creatorId: file.creatorId})

      map['000'] = {
        data: files,
        type: '_files_',
        _origin: {}
      }
    }

    return {
      code: 1,
      data: {map, path}
    }
  }

  @Get("/file/getFiles")
  async getFiles(@Query() query) {
    let { parentId, extNames, groupId } = query

    if (typeof extNames === 'string') {
      extNames = extNames.split(',')
    }

    const files = await this.fileDao.query({parentId, extNames, groupId})

    return {
      code: 1,
      data: files
    }
  }

  async _getParentModuleAndProjectInfo(id: number) {
    let res = {
      projectId: null, // 只存储最近的projectId，因为project不存在嵌套，只会有一个
	    moduleId: null, // 只存储最近的module，往上遍历会存在多次嵌套
      hierarchy: {},
      absolutePath: '',
      absoluteUUIDPath: ''
    }
    let pPointer: any = res.hierarchy;
    let qPointer: any = res.hierarchy;
    try {
      let count = 0;
      let tempItem = await this.fileDao.queryById(id)
      console.log('1111', tempItem.uuid)
      res.absolutePath = `/${tempItem.name}.${tempItem.extName}`
      // @ts-ignore
      res.absoluteUUIDPath = `/${tempItem.uuid}`
      if(tempItem.extName === 'folder-module') {
        if(!res.moduleId) {
          res.moduleId = tempItem.id
        }
      }
      // 最多遍历七层
      while(tempItem?.parentId && count < 7) {
        count++;
        tempItem = await this.fileDao.queryById(tempItem.parentId);
        switch(tempItem.extName) {
          case 'folder-module':
          case 'folder-project':
          case 'folder': {
            qPointer.parent = {
              fileId: tempItem.id,
              isProject: true,
              parent: {}
            }
            pPointer = pPointer.parent;
            qPointer = pPointer;
            res.absolutePath = `/${tempItem.name}${res.absolutePath}`
            // @ts-ignore
            res.absoluteUUIDPath = `/${tempItem.uuid}${res.absoluteUUIDPath}`
            break;
          }
        }
        // todo: build hierarchy
        if(tempItem.extName === 'folder-module') {
          if(!res.moduleId) {
            res.moduleId = tempItem.id
          }
        } else if(tempItem.extName === 'folder-project') {
          res.projectId = tempItem.id
          // break
        }
      }
      if(!tempItem?.parentId && tempItem?.groupId) {
        // 补充协作组信息，作为文件的绝对路径
        const [coopGroupInfo] = await this.userGroupDao.queryByIds({ids: [tempItem?.groupId]})
        res.absolutePath = `/${coopGroupInfo.name}${res.absolutePath}`
        // @ts-ignore
        res.absoluteUUIDPath = `/${coopGroupInfo.name}${res.absoluteUUIDPath}`
      }
      return res
    } catch(e) {
      throw e
    }
  }

  @Get("/file/getParentModuleAndProjectInfo")
  async getParentModuleAndProjectInfo(@Query('id') id: number) {
    if(!id) {
      return {
        code: -1,
        msg: '缺少ID'
      }
    }
    try {
      let res = await this._getParentModuleAndProjectInfo(id)
      return {
        code: 1,
        data: res
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message
      }
    }
  }

  @Get("/file/getMyFiles")
  async getMyFiles(@Query() query) {
    const { userId, parentId, extNames, status } = query
    const params: any = {
      userId,
      parentId,
      status
    }
    if (typeof extNames === 'string') {
      params.extNames = extNames.split(',')
    }

    const files = await this.fileDao.getMyFiles(params)

    return {
      code: 1,
      data: files.filter((item) => {
        if (item.hasIcon === "1") {
          item.icon = `/api/workspace/getFileIcon?fileId=${item.id}`;
        }

        return item.extName !== "component";
      }),
    }
  }

  @Get("/file/getGroupFiles")
  async getGroupFiles(@Query() query) {
    const { userId, parentId, extNames, status, groupId } = query
    const params: any = {
      userId,
      parentId,
      status,
      groupId
    }
    if (typeof extNames === 'string') {
      params.extNames = extNames.split(',')
    }

    const files = await this.fileDao.getGroupFiles(params)

    return {
      code: 1,
      data: files.filter((item) => {
        if (item.hasIcon === "1") {
          item.icon = `/api/workspace/getFileIcon?fileId=${item.id}`;
        }

        return item.extName !== "component";
      }),
    }
  }

  @Get("/file/getFilePath")
  async getFilePath(@Query() query) {
    const { fileId, userId, groupId } = query;
    const path = [];

    if (fileId) {
      let [file] = await this.fileDao.getFiles({ id: fileId });

      const folderExtnames = ['folder', 'folder-project', 'folder-module']

      if (file) {
        let { extName, parentId, groupId } = file;

        if (folderExtnames.includes(extName)) {
          path.unshift(file);

          while (parentId) {
            file = await this.fileDao.queryById(parentId);
            parentId = file?.parentId;

            path.unshift(file);
          }

          if (groupId) {
            console.log('查一下协作组')
            const group = await this.userGroupDao.queryById({id: groupId})

            path.unshift(group)
          }
        }
      }
    } else if (groupId) {
      const group = await this.userGroupDao.queryById({id: groupId})
      path.unshift(group)
    }

    return {
      code: 1,
      data: path,
    };
  }

  @Get("/file/checkFileCanCreate")
  async checkFileCanCreate(@Query() query) {
    const { fileName, extName, parentId, groupId, userId } = query
    const params: any = {
      name: fileName,
      extName,
      parentId,
      groupId
    }

    if (!groupId) {
      params.creatorId = userId
    }

    const file = await this.fileDao.exactQuery(params)

    return {
      code: 1,
      data: {
        next: !!!file
      }
    }
  }

  // 相对于relativeId, baseId的相对位置关系
  @Post("/file/getRelativePathBetweenFileId")
  async getRelativePathBetweenFileId(
    @Body('baseFileId') baseFileId: number,
    @Body('relativeId') relativeId: number
  ) {
    try {
      const basicFileHierarchy = await this._getParentModuleAndProjectInfo(baseFileId)
      const relativeFileHierarchy = await this._getParentModuleAndProjectInfo(relativeId)

      // "../../../测试数据源.domain"
      const relativePath = path.relative(path.dirname(basicFileHierarchy.absoluteUUIDPath), relativeFileHierarchy.absoluteUUIDPath)

      return {
        code: 1,
        data: relativePath
      }
    } catch (error) {
      return {
        code: -1,
        msg: error.message,
      }
    }
  }

  @Post('/file/getLatestSave')
  async getLatestSave(@Body('fileId') fileId: number) {
    if(!fileId) {
      return {
        code: -1,
        msg: '缺少fileId'
      }
    }
    const res = await this.fileContentDao.queryLatestSave({
      fileId: +fileId
    })
    return {
      code: 1,
      data: res
    }
  }

  async _getFileInfoByBaseFileIdAndRelativePath({ relativePath, baseFileId }) {
    try {
      /**
       * 四种case
        ../ssdsdsd/qweqwew
        ../dssds
        dsdsd
        dsdsd/dsads
       */
      const relativePartList = relativePath?.split('/');
      let currentFile = await this.fileDao.queryById(baseFileId);
      // 根据相对路径，查找源文件ID
      for(let l=relativePartList.length, i=0; i<l; i++) {
        const item = relativePartList[i];
        if(relativePartList[0] === '..') {
          if(l === 2) {
            // ../xxx
            if(item === '..') {
              // 开头 ../
              currentFile = await this.fileDao.queryById(currentFile?.parentId)
              // currentParent = await this.fileDao.queryById(currentFile?.parentId)
            } else {
              // 末端 ../pathB
              currentFile =  await this.fileDao.queryByUUIDAndParentId({
                uuid: item,
                parentId: currentFile?.parentId
              })
            }
          } else {
            if(item === '..') {
              // 开头 ../
              currentFile = await this.fileDao.queryById(currentFile?.parentId)
              // currentParent = await this.fileDao.queryById(currentFile?.parentId)
            } else {
              // 末端 ../pathB
              if(i === l - 1) {
                currentFile =  await this.fileDao.queryByUUIDAndParentId({
                  uuid: item,
                  parentId: currentFile?.id
                })
              } else {
                // 中建文件夹 ../pathA/
                currentFile =  await this.fileDao.queryByUUIDAndParentId({
                  uuid: item,
                  parentId: currentFile?.parentId
                })
              }
            }
          }
        } else {
          if(l === 1) {
            // 末端 pathA
            currentFile =  await this.fileDao.queryByUUIDAndParentId({
              uuid: item,
              parentId: currentFile?.parentId
            })
          } else {
            // 中间 pathA/pathB
            if(i === l - 1) {
              currentFile =  await this.fileDao.queryByUUIDAndParentId({
                uuid: item,
                parentId: currentFile?.id
              })
            } else {
              currentFile =  await this.fileDao.queryByUUIDAndParentId({
                uuid: item,
                parentId: currentFile?.parentId
              })
            }
          }
        }
      }
      return currentFile
    } catch (e) {
      console.log('_getFileInfoByBaseFileIdAndRelativePath', e.message)
      return null
    }
  }

  // 领域建模运行时
  @Post('/file/getFileInfoByBaseFileIdAndRelativePath')
  async getFileInfoByBaseFileIdAndRelativePath(
    // 通用参数
    @Body('relativePath') relativePath: string,
    @Body('baseFileId') baseFileId: any
  ) {
    if(!relativePath && !baseFileId) {
      return {
        code: -1,
        msg: 'relativePath 或 baseFileId 不可为空'
      }
    }
    const res = await this._getFileInfoByBaseFileIdAndRelativePath({
      relativePath,
      baseFileId
    })
    return {
      code: 1,
      data: res
    }
  }

  // TODO:写死查询的应用
  async getFolderProjectAppsByParentId({id, extNames}, files = []) {
    const items = await this.fileDao.getFilesByParentId({id, extNames})
    const promiseAry = []

    items.forEach(async (item) => {
      if (item.extName === 'pc-website') {
        files.push(item)
      } else {
        promiseAry.push(item)
      }
    })
    await Promise.all(promiseAry.map(async (item) => {
      await this.getFolderProjectAppsByParentId({id: item.id, extNames}, files)
    }))

    await Promise.all(files.map(async (file) => {
      const [pubInfo] = await this.filePubDao.getLatestPubByFileId(file.id)
      file.pubInfo = pubInfo
    }))

    return files
  }

  @Get('/file/getFolderProjectInfoByProjectId')
  async getFolderProjectInfoByProjectId(@Query() query) {
    const { id } = query
    const [folder, files] = await Promise.all([
      await this.fileDao.queryById(id),
      await this.getFolderProjectAppsByParentId({id, extNames: ['pc-website', 'folder', 'folder-project', 'folder-module']})
    ])

    return {
      code: 1,
      data: {
        ...folder,
        apps: files
      }
    }
  }
}
