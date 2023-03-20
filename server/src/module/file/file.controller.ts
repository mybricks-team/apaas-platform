import FileContentDao from "../../dao/FileContentDao";
import FileDao from "../../dao/FileDao";
import UserDao from '../../dao/UserDao';
import FilePubDao from "../../dao/filePub.dao";
import FileCooperationDao from "../../dao/FileCooperationDao";
import UserGroupDao from "../../dao/UserGroupDao";
import UserGroupRelationDao from '../../dao/UserGroupRelationDao'
import ServicePubDao from '../../dao/ServicePubDao'
import ModulePubDao from '../../dao/ModulePubDao'
import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { isNumber, uuid } from '../../utils'
import ModuleDao from "../../dao/ModuleDao";
const path = require('path');

@Controller("/paas/api")
export default class FileService {
  fileDao: FileDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  fileCooperationDao: FileCooperationDao;
  userDao: UserDao;
  userGroupDao: UserGroupDao;
  userGroupRelationDao: UserGroupRelationDao;
  servicePubDao: ServicePubDao;
  moduleDao: ModuleDao;
  modulePubDao: ModulePubDao

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
    this.fileCooperationDao = new FileCooperationDao();
    this.userDao = new UserDao();
    this.userGroupDao = new UserGroupDao();
    this.userGroupRelationDao = new UserGroupRelationDao();
    this.servicePubDao = new ServicePubDao()
    this.moduleDao = new ModuleDao()
    this.modulePubDao = new ModulePubDao()
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
    const user = await this.userDao.queryByEmail({ email: userId })
    const result = await this.fileDao.update({ id, name, updatorId: user.email, updatorName: user.name || user.email })

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

    const [file] = await Promise.all([
      await this.fileDao.queryById(fileId),
      /** 删除超时用户，status设置为-1 */
      await this.fileCooperationDao.delete({ fileId, timeInterval })
    ])

    /** 查userId是否在当前fileId协作过 */
    let [curUser, numberOfOnlineUsers, roleDescription] = await Promise.all([
      await this.fileCooperationDao.query({ userId, fileId }),
      await this.fileCooperationDao.numberOfOnlineUsers({ fileId }),
      new Promise(async (resolve) => {
        const { groupId } = file
        if (!groupId) {
          resolve((file.creatorId === userId) ? 1 : 3)
        } else {
          const userGroupRelation = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({ userId, userGroupId: groupId, status: 1 })
          resolve(userGroupRelation?.roleDescription || 3)
        }
      })
    ])
    const hasUser = !!numberOfOnlineUsers
    let finalStatus: -1 | 0 | 1 = 0

    /** 没有用户在线，并且有编辑权限，自动上锁, 设置status为1 */
    if (!hasUser && [1, 2].includes(roleDescription as number)) {
      finalStatus = 1
    }

    if (curUser) {
      /**
       * 是，更新状态
       *  已在线，状态不变
       *  未在线，状态使用finalStatus
       */
      const curStatus = curUser.status;
      await this.fileCooperationDao.update({ userId, fileId, status: curStatus === -1 ? finalStatus : curStatus })
    } else {
      /** 否，插入一条status为finalStatus的记录 */
      await this.fileCooperationDao.create({ userId, fileId, status: finalStatus })
    }

    const cooperationUsers = await this.fileCooperationDao.queryOnlineUsers({ fileId })
    const curUserIndex = cooperationUsers.findIndex((cooperationUser) => cooperationUser.userId === userId)
    /** 把当前用户提前 */
    cooperationUsers[0] = cooperationUsers.splice(curUserIndex, 1, cooperationUsers[0])[0]

    const userIds = cooperationUsers.map((cooperationUser) => cooperationUser.userId)
    /** 查询用户信息 */
    const users = await this.userDao.queryByEmails({ emails: userIds })

    return {
      code: 1,
      data: {
        users: cooperationUsers.map((cooperationUser, index) => {
          const user = users[index]
          return {
            name: user.name,
            userId: user.email,
            avatar: user.avatar,
            status: cooperationUser.status,
            updateTime: cooperationUser.updateTime
          }
        }),
        roleDescription
      }
    }
  }

  @Post("/file/toggleFileCooperationStatus")
  async toggleFileCooperationStatus(@Body() body) {
    const { userId, status } = body
    const fileId = Number(body.fileId)

    if (!isNumber(fileId) || !userId) {
      return {
        code: -1,
        data: null,
        message: '参数fileId或userId不合法'
      }
    }

    if (status === 1) {
      // 上锁
      const [file, editUser] = await Promise.all([
        await this.fileDao.queryById(fileId),
        await this.fileCooperationDao.queryEditUser({ fileId })
      ])

      if (editUser) {
        return {
          code: 1,
          data: null,
          message: '当前文件已被上锁，无权操作'
        }
      }

      let roleDescription = 3

      const { groupId, creatorId } = file

      if (!groupId) {
        roleDescription = (creatorId === userId) ? 1 : 3
      } else {
        const userGroupRelation = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({ userId, userGroupId: groupId, status: 1 })
        roleDescription = userGroupRelation?.roleDescription || 3
      }

      if ([1, 2].includes(roleDescription)) {
        await this.fileCooperationDao.update({ fileId, userId, status: 1 })
        return {
          code: 1,
          data: {}
        }
      } else {
        return {
          code: 1,
          data: null,
          message: '没有当前文件的操作权限'
        }
      }
    } else {
      // 解锁
      await this.fileCooperationDao.update({ fileId, userId, status: 0 })
      return {
        code: 1,
        data: {}
      }
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

    while (parentId) {
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


    while (parentId) {
      file = await this.fileDao.queryById(parentId);
      const files = await this.fileDao.query({ parentId: file.id, groupId: file.groupId, extNames: [extName, 'folder', 'folder-project', 'folder-module'] })
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
      const files = await this.fileDao.query({ groupId: file.groupId, extNames: [extName, 'folder', 'folder-project', 'folder-module'] })

      map['000'] = {
        data: files,
        type: '_files_',
        _origin: {}
      }
    } else {
      const files = await this.fileDao.query({ extNames: [extName, 'folder', 'folder-project', 'folder-module'], creatorId: file.creatorId })

      map['000'] = {
        data: files,
        type: '_files_',
        _origin: {}
      }
    }

    return {
      code: 1,
      data: { map, path }
    }
  }

  @Get("/file/getFiles")
  async getFiles(@Query() query) {
    let { parentId, extNames, groupId, creatorId } = query

    if (typeof extNames === 'string') {
      extNames = extNames.split(',')
    }

    const files = await this.fileDao.query({parentId, extNames, groupId, creatorId})

    return {
      code: 1,
      data: files
    }
  }
	
	@Get('/file/getFileList')
	async getFileList(@Query() query) {
		const { parentId, creatorId, fileId } = query;
		
		if (!parentId) {
			const file = await this.fileDao.queryById(fileId);
			
			let current = file ? JSON.parse(JSON.stringify(file)) : null;
			while (current && current.extName !== 'folder-project') {
				if (current.parentId) {
					current = await this.fileDao.queryById(current.parentId);
				} else if (!current.groupId) {
					current = null;
					break;
				} else {
					break;
				}
			}
			
			// 我的
			if (!current) {
				return {
					code: 1,
					data: (await this.fileDao.getMyFiles({ userId: creatorId })).map(item => {
						delete item.icon;
						return item;
					})
				};
			} else if (current.extName === 'folder-project') {
				return {
					code: 1,
					data: (await this.fileDao.getFilesByParentId({ id: current.id })).map(item => {
						delete item.icon;
						return item;
					})
				};
			} else if (current.groupId) {
				return {
					code: 1,
					data: (await this.fileDao.getGroupFiles({ groupId: current.groupId })).map(item => {
						delete item.icon;
						
						return item;
					})
				};
			} else {
				return { code: 1, data: [] };
			}
		} else {
			return {
				code: 1,
				data: (await this.fileDao.getFilesByParentId({ id: parentId })).map(item => {
					delete item.icon;
					return item;
				}),
			};
		}
	}

  async _getParentModuleAndProjectInfo(id: number) {
    let res = {
      projectId: null, // 只存储最近的projectId，因为project不存在嵌套，只会有一个
	    moduleId: null, // 只存储最近的module，往上遍历会存在多次嵌套
      // hierarchy: {},
      // absolutePath: '',
      // absoluteUUIDPath: ''
    }
    // let pPointer: any = res.hierarchy;
    // let qPointer: any = res.hierarchy;
    try {
      let count = 0;
      let tempItem = await this.fileDao.queryById(id)
      // res.absolutePath = `/${tempItem.name}.${tempItem.extName}`
      // @ts-ignore
      res.absoluteUUIDPath = `/${tempItem.uuid}`
      if (tempItem.extName === 'folder-module') {
        if (!res.moduleId) {
          res.moduleId = tempItem.id
        }
      }
      // 最多遍历七层
      while (tempItem?.parentId && count < 7) {
        count++;
        // 恶心兼容，等待完全删除
        tempItem = await this.fileDao.queryById(tempItem.parentId, [1, -1]);
        // switch(tempItem.extName) {
        //   case 'folder-module':
        //   case 'folder-project':
        //   case 'folder': {
        //     qPointer.parent = {
        //       fileId: tempItem.id,
        //       isProject: true,
        //       parent: {}
        //     }
        //     pPointer = pPointer.parent;
        //     qPointer = pPointer;
        //     res.absolutePath = `/${tempItem.name}${res.absolutePath}`
        //     // @ts-ignore
        //     res.absoluteUUIDPath = `/${tempItem.uuid}${res.absoluteUUIDPath}`
        //     break;
        //   }
        // }
        // todo: build hierarchy
        if (tempItem.extName === 'folder-module') {
          if (!res.moduleId) {
            res.moduleId = tempItem.id
          }
        } else if (tempItem.extName === 'folder-project') {
          res.projectId = tempItem.id
          // break
        }
      }
      // if(!tempItem?.parentId && tempItem?.groupId) {
      //   // 补充协作组信息，作为文件的绝对路径
      //   const [coopGroupInfo] = await this.userGroupDao.queryByIds({ids: [tempItem?.groupId]})
      //   res.absolutePath = `/${coopGroupInfo.name}${res.absolutePath}`
      //   // @ts-ignore
      //   res.absoluteUUIDPath = `/${coopGroupInfo.name}${res.absoluteUUIDPath}`
      // }
      return res
    } catch (e) {
      throw e
    }
  }

  @Get("/file/getParentModuleAndProjectInfo")
  async getParentModuleAndProjectInfo(@Query('id') id: number) {
    if (!id) {
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
    } catch (e) {
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
            const group = await this.userGroupDao.queryById({ id: groupId })

            path.unshift(group)
          }
        }
      }
    } else if (groupId) {
      const group = await this.userGroupDao.queryById({ id: groupId })
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
    @Body('relativeId') relativeId: number,
    @Body('uuid') uuid: number
  ) {
    try {
      if (uuid) {
        const { absoluteUUIDPath } = await this._getParentModuleAndProjectInfo(uuid)
        const pathAry = absoluteUUIDPath.split('/')

        return {
          code: 1,
          data: pathAry[pathAry.length - 1]
        }
      }
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
    if (!fileId) {
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
      for (let l = relativePartList.length, i = 0; i < l; i++) {
        const item = relativePartList[i];
        if (relativePartList[0] === '..') {
          if (l === 2) {
            // ../xxx
            if (item === '..') {
              // 开头 ../
              currentFile = await this.fileDao.queryById(currentFile?.parentId)
              // currentParent = await this.fileDao.queryById(currentFile?.parentId)
            } else {
              // 末端 ../pathB
              currentFile = await this.fileDao.queryByUUIDAndParentId({
                uuid: item,
                parentId: currentFile?.parentId
              })
            }
          } else {
            if (item === '..') {
              // 开头 ../
              currentFile = await this.fileDao.queryById(currentFile?.parentId)
              // currentParent = await this.fileDao.queryById(currentFile?.parentId)
            } else {
              // 末端 ../pathB
              if (i === l - 1) {
                currentFile = await this.fileDao.queryByUUIDAndParentId({
                  uuid: item,
                  parentId: currentFile?.id
                })
              } else {
                // 中建文件夹 ../pathA/
                currentFile = await this.fileDao.queryByUUIDAndParentId({
                  uuid: item,
                  parentId: currentFile?.parentId
                })
              }
            }
          }
        } else {
          if (l === 1) {
            // 末端 pathA
            currentFile = await this.fileDao.queryByUUIDAndParentId({
              uuid: item,
              parentId: currentFile?.parentId
            })
          } else {
            // 中间 pathA/pathB
            if (i === l - 1) {
              currentFile = await this.fileDao.queryByUUIDAndParentId({
                uuid: item,
                parentId: currentFile?.id
              })
            } else {
              currentFile = await this.fileDao.queryByUUIDAndParentId({
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
    @Body('fileId') fileId: any
  ) {
    if (!fileId) {
      return {
        code: -1,
        msg: 'fileId 不可为空'
      }
    }

    const res = await this.fileDao.queryById(fileId)

    return {
      code: 1,
      data: res
    }
  }

  // TODO:写死查询的应用
  async getFolderProjectAppsByParentId({ id, extNames }, files = []) {
    const items = await this.fileDao.getFilesByParentId({ id, extNames })
    const promiseAry = []

    items.forEach(async (item) => {
      if (item.extName === 'pc-website') {
        files.push(item)
      } else {
        promiseAry.push(item)
      }
    })
    await Promise.all(promiseAry.map(async (item) => {
      await this.getFolderProjectAppsByParentId({ id: item.id, extNames }, files)
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
    const [folder, [projectModuleInfo], files] = await Promise.all([
      await this.fileDao.queryById(id),
      await this.moduleDao.getProjectModuleInfo(id),
      await this.getFolderProjectAppsByParentId({ id, extNames: ['pc-website', 'folder', 'folder-project', 'folder-module'] })
    ])

    return {
      code: 1,
      data: {
        ...folder,
        apps: files,
        moduleList: JSON.parse(projectModuleInfo?.module_info || '{}')?.moduleList || []
      }
    }
  }

  @Get('/file/publish/getVersionsByFileId')
  async publishGetVersionsByFileId(@Query() query) {
    const { id, pageIndex, pageSize } = query
    const versions = await this.filePubDao.queryByFileId({ fileId: id, limit: pageSize, offset: pageSize * pageIndex })

    return {
      code: 1,
      data: versions
    }
  }

  @Post('/file/publish/batchCreateService')
  async batchCreateServicePublish(
    @Body('fileId') fileId: number,
    @Body('filePubId') filePubId: number,
    @Body('projectId') projectId: number,
    @Body('serviceContentList') serviceContentList: any[],
    @Body('env') env: string,
    @Body('creatorName') creatorName: string
  ) {
    try {
      if (!fileId || !serviceContentList) {
        return {
          code: -1,
          msg: 'fileId 或 serviceContent 为空'
        }
      }
      const res = await this.servicePubDao.batchCreate({
        fileId,
        serviceContentList,
        filePubId,
        projectId,
        env,
        creatorId: creatorName,
        creatorName: creatorName
      })
      return {
        code: 1,
        data: res
      }
    } catch (err) {
      return {
        code: -1,
        msg: err.message || '出错了'
      }
    }
  }

  @Post('/file/initialUUID')
  async initialUUID() {
    const files = await this.fileDao.getEmptyListOfUUID()
    const task = []
    files.forEach(file => {
      task.push(this.fileDao.initialUUID({
        id: file.id,
        uuid: uuid(10)
      }))
    })
    await Promise.all(task)
    console.log('更新结束')
    return {
      code: 1,
      msg: '更新结束'
    }
  }

  @Get('/file/getEditModuleComponentLibraryByProjectId')
  async getEditModuleComponentLibraryByProjectId(
    @Query('id') id: number,
    @Query('extName') extName: string,
    @Res() res: Response
  ) {
    if (!id) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.status(200).send('').end();
    } else {
      const projectInfoAry = await this.moduleDao.getProjectModuleInfo(id)
      let componentsStr = ''
      await Promise.all(projectInfoAry.map(async (projectInfo) => {
        const { module_info } = projectInfo
        const { moduleList } = JSON.parse(module_info)

        await Promise.all(moduleList.map(async (module) => {
          const { id, name, version } = module

          console.log("extName", extName);

          const cdms = await this.modulePubDao.queryPubInfo({
            moduleId: id,
            extNameList: [extName || 'cdm'],
            version: version
          })

          if (cdms?.length) {
            let comsStr = ''
            cdms.forEach((cdm) => {
              const content = JSON.parse(cdm.content)

              comsStr = comsStr + `
                {
                  data: ${JSON.stringify(content.data)},
                  icon: '${content.icon}',
                  title: '${content.title}',
                  version: '${content.version}',
                  namespace: '${content.namespace}',
                  inputs: ${JSON.stringify(content.inputs)},
                  outputs: ${JSON.stringify(content.outputs)},
                  editors: (${decodeURIComponent(content.editors)})(),
                  runtime: ${decodeURIComponent(content.runtime)},
                  upgrade: ${decodeURIComponent(content.upgrade)}
                },
              `
            })

            if (comsStr) {
              componentsStr = componentsStr + `
              comAray.push({
                id: '${id}',
                title: '${name}',
                comAray: [
                  ${comsStr}
                ]
              })
              `
            }
          }

          Promise.resolve()
        }))
      }))

      let editJS = `
        let comlibList = window['__comlibs_edit_'];
        if(!comlibList){
          comlibList = window['__comlibs_edit_'] = [];
        }
        let comAray = [];
        const newComlib = {
          id: '_module_component_library_',
          title: '模块组件库',
          version: '1.0.0',
          comAray
        };
        ${componentsStr}
        comlibList.push(newComlib);
      `

      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.status(200).send(editJS).end();
    }
  }

  @Get('/file/getModuleComponentsByProjectId')
  async getModuleComponentsByProjectId(@Query('id') id: number, @Query('extName') extName: string) {
    if (!id) {
      return {
        code: 1,
        data: []
      }
    } else {
      const projectInfoAry = await this.moduleDao.getProjectModuleInfo(id)

      const result = []

      await Promise.all(projectInfoAry.map(async (projectInfo) => {
        const { module_info } = projectInfo
        const { moduleList } = JSON.parse(module_info)

        await Promise.all(moduleList.map(async (module) => {
          const { id, version } = module
          const cdms = await this.modulePubDao.queryPubInfo({
            moduleId: id,
            extNameList: [extName || 'cdm'],
            version: version
          })

          if (cdms?.length) {
            cdms.forEach((cdm) => {
              result.push(JSON.parse(cdm.content))
            })
          }

          Promise.resolve()
        }))
      }))

      return {
        code: 1,
        data: result
      }
    }
  }
}
