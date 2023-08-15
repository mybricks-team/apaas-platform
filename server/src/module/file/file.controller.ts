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
import { isNumber, getAdminInfoByProjectId } from '../../utils'
import ModuleDao from "../../dao/ModuleDao";
import FileService from "./file.service";
import UserFileRelationDao from "../../dao/UserFileRelationDao";
import UserService from '../user/user.service';
const path = require('path');
import {Logger} from '@mybricks/rocker-commons'

@Controller("/paas/api/file")
export default class FileController {
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

  fileService: FileService
  userService: UserService
  userFileRelationDao: UserFileRelationDao

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
    this.fileService = new FileService()
    this.userService = new UserService()
    this.userFileRelationDao = new UserFileRelationDao()
  }

  @Get("/get")
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

  @Get("/getDeliveryChannel")
  async getDeliveryChannel(@Query() query) {
    const {
      id
    } = query ?? {};
    try {
      const file = await this.fileDao.queryById(
        id
      );
      const delivery = JSON.parse(file?.deliveryChannel || '[]') || [];
      return {
        code: 1,
        data: delivery,
      };

    } catch(e) {
      console.info(e)
      return {
        code: -1,
        msg: e.message || '出错了'
      }
    }
  }

  @Post('/delete')
  async deleteFile(
    @Body("fileId") fileId: number,
    @Body("updatorId") originUpdatorId: string,
  ) {
    const updatorId = await this.userService.getCurrentUserId(originUpdatorId);
    if(!fileId || !updatorId) {
      return {
        code: -1,
        msg: '参数不合法'
      }
    }
  
    try {
      const file = await this.fileDao.queryById(fileId)
      if(!file || file.creatorId !== updatorId) {
        return {
          code: -1,
          msg: '删除失败，您没有此文件权限'
        }
      }
      const res = await this.fileDao.deleteFile({ id: fileId, updatorId, updatorName: originUpdatorId })
      return {
        code: 1,
        data: res
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message || '创建出错'
      }
    }
  }

  @Post("/create")
  async create(
    @Body("name") name: string,
    @Body("creatorId") originCreatorId: string,
    @Body("creatorName") creatorName: string,
    @Body("extName") extName: string,
    @Body("groupId") groupId: number,
    @Body("description") description: string,
    @Body("parentId") parentId: number,
    @Body("icon") icon: string,
  ) {
    const creatorId = await this.userService.getCurrentUserId(originCreatorId);

    if(!name || !creatorId || !extName) {
      return { code: -1, msg: '参数不合法' };
    }
    const param = { parentId, groupId, name, extName, icon, creatorId, creatorName, description };

    try {
      const result = await this.fileDao.createFile(param)
      return {
        code: 1,
        data: result
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message || '创建出错'
      }
    }
  }

  @Post("/createFileBaseTemplate")
  async createFile(@Body() body) {
    const { userId: originUserId, name, extName, namespace, type, parentId, groupId, templateId } = body;
    const userId = await this.userService.getCurrentUserId(originUserId);

    if (!userId) {
      return { code: -1, msg: "缺少userId参数" };
    }
    try {
      const rtn = await this.fileDao.createFile({
        type,
        name,
        namespace,
        creatorId: userId,
        creatorName: originUserId,
        extName: extName,
        groupId,
        parentId,
      });
			
			if (rtn.id) {
        const latestSave = await this.fileContentDao.queryLatestSave({ fileId: templateId})
        await this.fileContentDao.create({
          fileId: rtn.id,
          content: latestSave?.content,
          version: '1.0.0',
          creatorId: userId,
          creatorName: originUserId,
        });
			} else {
        return { code: -1, msg: '新建失败，请重试' };
      }

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return { code: -1, msg: ex.message };
    }
  }

  @Post("/rename")
  async rename(
    @Body("id") id: number,
    @Body("name") name: string,
    @Body("userId") userId: string,
  ) {
    const user = await this.userDao.queryById({ id: userId })
    const result = await this.fileDao.update({ id, name, updatorId: user.id, updatorName: user.name })

    return {
      code: 1,
      data: result
    }
  }

  @Get("/getSysTemFiles")
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

  @Post("/getFileContentByFileIdAndPubVersion")
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

  @Get("/getCooperationUsers")
  async getCooperationUsers(@Query() query) {
    const { userId: originUserId, timeInterval } = query;
    const userId = await this.userService.getCurrentUserId(originUserId);
    const fileId = Number(query.fileId);

    if (!isNumber(fileId) || !userId) {
      return {
        code: -1,
        data: null,
        message: '参数fileId或userId不合法'
      }
    }

    const [file, versions] = await Promise.all([
      await this.fileDao.queryById(fileId),
      await this.fileContentDao.getContentVersions({
        fileId,
        limit: 1,
        offset: 0,
      }),
      /** 删除超时用户，status设置为-1 */
      await this.fileCooperationDao.delete({ fileId, timeInterval })
    ])

    /** 查userId是否在当前fileId协作过 */
    let [curUser, numberOfOnlineUsers, roleDescription] = await Promise.all([
      await this.fileCooperationDao.query({ userId, fileId }),
      await this.fileCooperationDao.numberOfOnlineUsers({ fileId }),
      new Promise(async (resolve) => {
        const { creatorId, groupId } = file

        // 创建人、最高权限
        if (creatorId === userId) {
          resolve(1)
        } else {
          const [fileDescription, groupDescription] = await Promise.all([
            new Promise(async (resolve) => {
              const userFileFelation = await this.userFileRelationDao.query({userId, fileId})
              resolve(userFileFelation?.roleDescription)
            }),
            new Promise(async (resolve) => {
              if (!groupId) {
                resolve(undefined)
              } else {
                const userGroupRelation = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({ userId, userGroupId: groupId, status: 1 })
                resolve(userGroupRelation?.roleDescription)
              }
            })
          ])

          resolve(fileDescription || groupDescription || 3)
        }
      })
    ])
    const hasUser = !!numberOfOnlineUsers
    let finalStatus: -1 | 0 | 1 = 0

    /** 没有用户在线，并且有编辑权限，自动上锁, 设置status为1 */
    if (!hasUser && [1, 2, '1', '2'].includes(roleDescription as number)) {
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
    const users = await this.userDao.queryByIds({ ids: userIds })

    Reflect.deleteProperty(file, 'icon');
    if (versions?.[0]?.version) {
      file.version = versions[0].version
    }

    return {
      code: 1,
      data: {
        users: cooperationUsers.filter((_, index) => {
          return users[index]
        }).map((cooperationUser, index) => {
          const user = users[index]
          return {
            id: user.id,
            name: user.name,
            userId: user.email,
            email: user.email,
            avatar: user.avatar,
            status: cooperationUser.status,
            updateTime: cooperationUser.updateTime
          }
        }),
        roleDescription,
        file
      }
    }
  }

  @Get("/getAuthorizedUsers")
  async getAuthorizedUsers(@Query() query){
    const { fileId, groupId } = query
    const [groupAdminUsers, fileCreator, groupOwner]: any = await Promise.all([
      new Promise(async (resolve) => {
        if (groupId) {
          const groupAdminUsers = await this.userGroupRelationDao.queryUsersByGroupId({
            userGroupId: groupId,
            roleDescription: "1",
          });
          resolve(groupAdminUsers.map((user) =>{
            return {
              ...user,
              userGroupId: user.user_group_id,
              userId: user.email,
              originUserId: user.user_id,
              creatorId: user.creator_id,
              creatorName: user.creator_name,
              createTime: user.create_time,
              updateTime: user.update_time,
              roleDescription: user.role_description
            }
          }));
        } else {
          resolve([]);
        }
      }),
      new Promise(async (resolve) => {
        if (fileId) {
          const file = await this.fileDao.queryById(fileId);
          if (file) {
            const user = await this.userDao.queryById({
              id: file.creatorId,
            });
            resolve({ originUserId: user.id, userId: user.email, name: user.name, email: user.email, avatar: user.avatar});
          }
        } else {
          resolve(null);
        }
      }),
      new Promise(async (resolve) => {
        if (groupId) {
          const groupOwner = await this.userDao.getGroupOwnerInfo({ groupId });
          resolve(groupOwner);
        } else {
          resolve(null);
        }
      }),
    ]);

    if (
      fileCreator &&
      !groupAdminUsers.find((user) => user.email === fileCreator?.email)
    ) {
      groupAdminUsers.push(fileCreator);
    }

    if (groupOwner) {
      const index = groupAdminUsers.findIndex((user) => user.email === groupOwner.email);

      if (index !== -1) {
        const owner = groupAdminUsers[index];
        groupAdminUsers[index] = groupAdminUsers[0];
        groupAdminUsers[0] = owner;
      }
    }

    return {
      code: 1,
      data: groupAdminUsers
    }
  }

  @Post("/toggleFileCooperationStatus")
  async toggleFileCooperationStatus(@Body() body) {
    const { userId: originUserId, status } = body
    const userId = await this.userService.getCurrentUserId(originUserId);
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

      if (creatorId === userId) {
        roleDescription = 1
      } else {
        const [fileDescription, groupDescription] = await Promise.all([
          new Promise(async (resolve) => {
            const userFileRelation = await this.userFileRelationDao.query({userId, fileId})
            resolve(userFileRelation?.roleDescription)
          }),
          new Promise(async (resolve) => {
            if (!groupId) {
              resolve(undefined)
            } else {
              const userGroupRelation = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({ userId, userGroupId: groupId, status: 1 })
              resolve(userGroupRelation?.roleDescription)
            }
          })
        ])
        roleDescription = fileDescription || groupDescription || 3
      }

      if ([1, 2, '1', '2'].includes(roleDescription)) {
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

  @Post("/createCooperationUser")
  async createCooperationUser(@Body() body) {
    const { userId: originUserId, email, creatorId: originCreatorId, groupId, fileId, roleDescription } = body;
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const creatorId = await this.userService.getCurrentUserId(originCreatorId);
    const user = await this.userDao.queryById({id: creatorId});

    if (groupId) {
      const data = await this.userGroupRelationDao.create({
        creatorId,
        creatorName: user.name,
        roleDescription,
        userGroupId: groupId,
        userId
      })

      return {
        code: 1,
        data
      }
    } else {
      const data = await this.userFileRelationDao.create({
        userId,
        fileId,
        creatorId,
        roleDescription
      })

      return {
        code: 1,
        data
      }
    }
  }

  @Post("/updateCooperationUser")
  async updateCooperationUser(@Body() body) {
    const { userId: originUserId, email, updatorId: originUpdatorId, groupId, fileId, roleDescription, status } = body
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const updatorId = await this.userService.getCurrentUserId(originUpdatorId);
    const user = await this.userDao.queryById({id: updatorId});

    if (groupId) {
      const data = this.userGroupRelationDao.update({
        updatorId,
        updatorName: user.name,
        roleDescription: roleDescription,
        userGroupId: groupId,
        userId,
        status
      })

      return {
        code: 1,
        data
      }
    } else {
      const data = await this.userFileRelationDao.create({
        userId,
        fileId,
        creatorId: updatorId,
        roleDescription
      })

      return {
        code: 1,
        data
      }
    }
  }


  @Get("/checkInFolderProject")
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

  @Get("/getFileTreeMapByFile")
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

  @Get("/getFiles")
  async getFiles(@Query() query) {
    let { parentId, extNames, groupId, creatorId } = query

    if (typeof extNames === 'string') {
      extNames = extNames.split(',')
    }

    const files = await this.fileDao.query({ parentId, extNames, groupId, creatorId })

    return {
      code: 1,
      data: files
    }
  }

  @Get("getFile")
  async getFile(@Query() query) {
    const { id } = query

    const file = await this.fileDao.queryById(id)

    return {
      code: 1,
      data: file
    }
  }

  @Get('/getFileRoot')
  async getFileList(@Query() query) {
    const { parentId, creatorId: originCreatorId, fileId, checkModule } = query;
    const creatorId = await this.userService.getCurrentUserId(originCreatorId);

    if (!parentId) {
      const file = await this.fileDao.queryById(fileId);

      let current = file ? JSON.parse(JSON.stringify(file)) : null;
      while (current && current.extName !== 'folder-project' && (checkModule ? current.extName !== 'folder-module' : true)) {
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
          data: {
            id: 0,
            name: "我的",
            extName: "my-file",
            isMyFile: true,
            dataSource: (await this.fileDao.getMyFiles({ userId: creatorId })).map(item => {
              delete item.icon;
              item.isMyFile = true;
              item.parentIdPath = '0';
              return { ...item, isMyFile: true };
            }),
          },
        };
      } else if (current.extName === 'folder-project' || (checkModule ? current.extName === 'folder-module' : false)) {
        delete current.icon;
        return {
          code: 1,
          data: current
        };
      } else if (current.groupId) {
        const [group] = await this.userGroupDao.queryByIds({ ids: [current.groupId] });

        return { code: 1, data: { ...group, extName: 'group' } };
      } else {
        return { code: 1, data: null };
      }
    } else {
      const file = await this.fileDao.queryById(parentId);
      file && delete file.icon;

      return { code: 1, data: file };
    }
  }

  async _getParentModuleAndProjectInfo(id: number) {
    let res = {
      projectId: null, // 只存储最近的projectId，因为project不存在嵌套，只会有一个
	    moduleId: null, // 只存储最近的module，往上遍历会存在多次嵌套
      groupId: null, // 协作组
      groupName: '',
      absoluteNamePath: '',
      absoluteIdPath: ''
    }
    const hierarchy = {}
    let pPointer: any = hierarchy;
    let qPointer: any = hierarchy;
    try {
      let count = 0;
      let tempItem = await this.fileDao.queryById(id)
      // @ts-ignore
      res.absoluteIdPath = `/${tempItem.id}`
      res.absoluteNamePath = `/${tempItem.name}.${tempItem.extName}`
      if (tempItem?.extName === 'folder-module') {
        if (!res.moduleId) {
          res.moduleId = tempItem.id
        }
      }
      // 最多遍历七层
      while (tempItem?.parentId && count < 7) {
        count++;
        // 恶心兼容，等待完全删除
        tempItem = await this.fileDao.queryById(tempItem.parentId, [1, -1]);
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
            res.absoluteNamePath = `/${tempItem.name}${res.absoluteNamePath}`
            // @ts-ignore
            res.absoluteIdPath = `/${tempItem.id}${res.absoluteIdPath}`
            break;
          }
        }
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
      if(!tempItem?.parentId && tempItem?.groupId) {
        // 补充协作组信息，作为文件的绝对路径
        const [coopGroupInfo] = await this.userGroupDao.queryByIds({ids: [tempItem?.groupId]})
        res.absoluteNamePath = `/${coopGroupInfo.name}${res.absoluteNamePath}`
        // @ts-ignore
        res.absoluteIdPath = `/${coopGroupInfo.id}${res.absoluteIdPath}`;
        res.groupId = coopGroupInfo.id;
        res.groupName = coopGroupInfo.name;
      }
      return res
    } catch (e) {
      throw e
    }
  }

  @Get("/getParentModuleAndProjectInfo")
  async getParentModuleAndProjectInfo(@Query('id') id: number) {
    if (!id) {
      return {
        code: -1,
        msg: '缺少ID'
      }
    }
    // if(id == 0) {
    //   // sdk兜底fileId，直接返回接口
    //   return {
    //     code: 1
    //   }
    // }
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

  @Get("/getMyFiles")
  async getMyFiles(@Query() query) {
    const { userId: originUserId, parentId, extNames, status } = query
    const userId = await this.userService.getCurrentUserId(originUserId);
    const params: any = {
      userId,
      parentId,
      status
    }
    if (typeof extNames === 'string') {
      params.extNames = extNames.split(',')
    }

    const files = await this.fileDao.getMyFiles(params)
    // const userInfo = await this.userDao.queryById({ id: userId })

    return {
      code: 1,
      data: files.filter((item) => {
        const { hasIcon } = item
        if (hasIcon === "1") {
          item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
        } else if (hasIcon.startsWith('http')) {
          item.icon = hasIcon
        }
        // 我的文件可以直接重写creatorName
        // item.creatorName = userInfo.name || userInfo.email

        return item.extName !== "component";
      }),
    }
  }

  @Get("/getGroupFiles")
  async getGroupFiles(@Query() query) {
    const { parentId, extNames, status, groupId } = query
    const params: any = {
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
        const { hasIcon } = item
        if (hasIcon === "1") {
          item.icon = `/api/workspace/getFileIcon?fileId=${item.id}`;
        } else if (hasIcon.startsWith('http')) {
          item.icon = hasIcon
        }

        return item.extName !== "component";
      }),
    }
  }

  @Get("/getFolderProjectRoot")
  async getFolderProjectRoot(@Query() query) {
    let { fileId } = query
    let rootFile

    while (fileId) {
      rootFile = await this.fileDao.queryById(fileId)

      if (rootFile.extName === 'folder-project') {
        fileId = null
      } else {
        fileId = rootFile.parentId
      }
    }

    return {
      code: 1,
      data: rootFile
    }
  }

  @Get("/getFolderFiles")
  async getFolderFiles(@Query() query) {
    const { fileId, extNames } = query
    Logger.info(`[API][/paas/api/file/getFolderFiles]: extNames: ${extNames}`)

    const result = await this.fileDao.getFolderFiles({
      id: fileId,
      extNames
    })

    return {
      code: 1,
      data: result
    }
  }

  @Get("/getFilePath")
  async getFilePath(@Query() query) {
    const { fileId, groupId } = query;
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
            Logger.info(`[API][/paas/api/file/getFilePath]: 查一下协作组: ${groupId}`)
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

  @Get("/checkFileCanCreate")
  async checkFileCanCreate(@Query() query) {
    const { fileName, extName, parentId, groupId, userId, isCreate } = query
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
    let error = !file ? '' : '相同路径下不允许创建同名文件！';

    /** 领域模型文件，在项目下只允许创建一个模型文件 */
    if (!error && isCreate && extName === 'domain' && parentId) {
      const file = await this.fileDao.queryById(parentId);

      let current = file ? JSON.parse(JSON.stringify(file)) : null;
      while (current && current.extName !== 'folder-project') {
        if (current.parentId) {
          current = await this.fileDao.queryById(current.parentId);
        } else if (!current.parentId) {
          current = null;
          break;
        }
      }

      /** 项目下 */
      if (current && current.extName === 'folder-project') {
        const domainFiles = await this.fileDao.queryFlattenFileTreeByParentId({ parentId: current.id, extNameList: ['domain'] });

        if (domainFiles.length) {
          error = '项目下不允许创建多个领域模型文件';
        }
      }
    }

    return { code: 1, data: { next: !error, message: error } };
  }

  @Post('/getLatestSave')
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

  @Post('/getLatestPub')
  async getLatestPub(@Body('fileId') fileId: number, @Body('type') type: string) {
    if (!fileId) {
      return {
        code: -1,
        msg: '缺少fileId'
      }
    }
    const res = await this.filePubDao.getLatestPubByFileId(+fileId, type)
    return {
      code: 1,
      data: res
    }
  }

  @Post('/moveFile')
  async moveFile(
    @Body('fileId') fileId: number,
    @Body('toGroupId') toGroupId: string,
    @Body('toFileId') toFileId: number,
  ) {
    const res = await this.fileService.moveFile({
      fileId,
      toFileId,
      toGroupId,
    });
    return {
      code: 1,
      ...res,
    };
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
      const [stagingPub] = await this.filePubDao.getLatestPubByFileId(file.id, 'staging')
      const [prodPubInfo] = await this.filePubDao.getLatestPubByFileId(file.id, 'prod')
      file.pubInfo = {
        staging: stagingPub,
        prod: prodPubInfo
      }
      file.adminLoginBasePath = `/runtime/mfs/project/${id}/admin_login.html?projectId=${id}&fileId=${file.id}`
    }))

    return files
  }

  @Post('/getFolderProjectInfoByProjectId')
  async getFolderProjectInfoByProjectId(@Body() body) {
    const { id, userId } = body
    const folder = await this.fileDao.queryById(id);
    const [[projectModuleInfo], files] = await Promise.all([
      await this.moduleDao.getProjectModuleInfo(id),
      await this.getFolderProjectAppsByParentId({ id, extNames: ['pc-website', 'folder', 'folder-project', 'folder-module'] })
    ])

    let data: any = {
      ...folder,
      apps: files,
      moduleList: JSON.parse(projectModuleInfo?.module_info || '{}')?.moduleList || []
    };
    if (folder.creatorId == userId) {
      data.adminInfo = {
        ...getAdminInfoByProjectId(id)
      }
    }
    return {
      code: 1,
      data: data
    }
  }

  @Get('/publish/getVersionsByFileId')
  async publishGetVersionsByFileId(@Query() query) {
    const { id, pageIndex, pageSize } = query
    const versions = await this.filePubDao.queryByFileId({ fileId: id, limit: pageSize, offset: pageSize * pageIndex })

    return {
      code: 1,
      data: versions
    }
  }

  @Post('/publish/batchCreateService')
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

  @Get('/getEditModuleComponentLibraryByProjectId')
  async getEditModuleComponentLibraryByProjectId(
    @Query('id') id: number,
    @Query('extName') extName: string,
    @Res() res: Response
  ) {

    // 非项目环境下，返回空
    if (!id) {
      let editJS = `
        let comlibList = window['__comlibs_edit_'];
        if(!comlibList){
          comlibList = window['__comlibs_edit_'] = [];
        }
      `
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.status(200).send(editJS).end();
      return;
    }

    const projectInfoAry = await this.moduleDao.getProjectModuleInfo(id)
    let componentsStr = ''
    await Promise.all(projectInfoAry.map(async (projectInfo) => {
      const { module_info } = projectInfo
      const { moduleList } = JSON.parse(module_info)

      await Promise.all(moduleList.map(async (module) => {
        const { id, name, version } = module

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

  @Get('/getModuleComponentsByProjectId')
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

  @Get('/getModuleHtmlByProjectId')
  async getModulesByProjectId(@Query('id') id: number) {
    let modules = []

    if (id) {
      const [projectInfo] = await this.moduleDao.getProjectModuleInfo(id)

      if (projectInfo) {
        const { moduleList } = JSON.parse(projectInfo.module_info)

        await Promise.all(moduleList.map((module, index) => {
          return new Promise(async (resolve) => {
            const { id, version } = module
            const htmls: any = await this.modulePubDao.queryPubInfo({
              moduleId: id,
              extNameList: ['html'],
              version: version
            })

            moduleList[index].htmls = htmls.map((html) => {
              return {
                name: html.file_name,
                id: html.file_id
              }
            })

            resolve(true)
          })
        }))

        modules = moduleList
      }
    }

    return {
      code: 1,
      data: modules
    }
  }

  /**
   * @description [TODO]接口目前只有小程序在用，因为别的应用查project下文件的时候不应该只查file_content，查项目下文件目前太乱了，每个应用都有一套自己的逻辑
   * @param id
   * @param extNames
   * @returns
   */
  @Get('getProjectFilesByProjectId')
  async getModuleFilesByProjectId(@Query('id') id: number, @Query('extNames') extNames?: string) {
    if (!id || (!!extNames && (!extNames?.split || !Array.isArray(extNames.split(','))))) {
      return {
        code: -1,
        message: '参数不合法'
      }
    }

    const extNameList = extNames ? extNames.split(',') : undefined
    const [projectInfo] = await this.moduleDao.getProjectModuleInfo(id)

    /** 获取模块内的发布文件 */
    const { moduleList } = JSON.parse(projectInfo?.module_info ?? JSON.stringify({ moduleList: [] }))
    let moduleFilePubs = await Promise.all(moduleList.map(async (module, index) => {
      const { id, version } = module
      const filePubs: any = await this.modulePubDao.queryPubInfo({
        moduleId: id,
        extNameList,
        version: version
      })
      return filePubs
    }))
    moduleFilePubs = (moduleFilePubs ?? []).flat(1).map(pub => ({ ...pub, module_pub_id: pub.id }))

    /** 获取项目内的文件 */
    let projectFiles = await this.fileDao.queryFlattenFileTreeByParentId({ parentId: projectInfo?.file_id ?? id, extNameList })
    const moduleFileIds = moduleFilePubs.map(pub => pub.file_id)
    projectFiles = projectFiles.filter(file => !moduleFileIds.includes(file.id))

    /** 获取项目内发布的最新保存记录 */
    const projectFilePubs = await this.fileContentDao.queryLatestSaves({ fileIds: projectFiles.map(file => file.id) })
    const _projectFilePubs = projectFilePubs.map(pub => ({ ...pub, file_content_id: pub.id }))

    /** 数据来自两个不同的表（模块发布表、文件内容表），只取同样意义的字段，不然容易乱 */
    const results = moduleFilePubs.concat(_projectFilePubs ?? []).map(pub => {
      return {
        module_pub_id: pub.module_pub_id,
        file_content_id: pub.file_content_id,
        content: pub.content,
        file_id: pub.file_id,
        verision: pub.verision,
        create_time: pub.create_time
      }
    })

    return {
      code: 1,
      data: results
    }
  }

  @Post('/share/mark')
  async shareMark(@Body('id') id: number, @Body('userId') userId: string) {
    if (!id || !userId) {
      return {
        code: -1,
        msg: '缺少必要参数 id 或 userId'
      }
    }
    const rtn = await this.fileDao.updateShare({
      id: id,
      shareType: 1,
      updatorId: userId
    })
    return {
      code: rtn.affectedRows > 0 ? 1 : -1,
      msg: rtn.affectedRows <= 0 ? '分享失败' : ''
    }
  }


  @Post('/share/unmark')
  async shareUnmark(@Body('id') id: number, @Body('userId') userId: string) {
    if (!id || !userId) {
      return {
        code: -1,
        msg: '缺少必要参数 id 或 userId'
      }
    }
    const rtn = await this.fileDao.updateShare({
      id: id,
      shareType: null,
      updatorId: userId,
      updatorName: userId
    })
    return {
      code: rtn.affectedRows > 0 ? 1 : -1,
      msg: rtn.affectedRows <= 0 ? '取消分享失败' : ''
    }
  }

  @Post('/getCountOfUserAndExt')
  async getCountOfUserAndExt(@Body('userId') userId: string, @Body('extName') extName: string) {
    if (!userId || !extName) {
      return {
        code: -1,
        msg: '缺少必要参数'
      }
    }
    const rtn = await this.fileService.getCountOfUserAndExt({
      userId: userId,
      extName: extName
    })
    return {
      code: 1,
      data: rtn
    }
  }

  @Post('/updateDeliveryChannel')
  async updateFile(
    @Body('id') id: number,
    @Body('deliveryChannel') deliveryChannel: string
  ) {
    if (!id) {
      console.info(`[updateDeliveryChannel]: 缺少参数`);
      return {
        msg: '缺少参数',
        code: -1
      };
    }
    try {
      const res = await this.fileService.modifyFileDeliveryChannel({
        id,
        deliveryChannel
      });
      return {
        code :1,
        data: res,
      };
    } catch(e) {
      return {
        code: -1,
        msg: e.message || '更新渠道失败'
      }
    }
  }
}
