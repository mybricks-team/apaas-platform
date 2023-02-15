import FileContentDao from "./../dao/FileContentDao";
import FileDao from "../dao/FileDao";
import UserDao from '../dao/UserDao';
import FilePubDao from "../dao/filePub.dao";
import FileCooperationDao from "../dao/FileCooperationDao";
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { isNumber } from '../utils'

@Controller("/paas/api")
export default class ConfigService {
  fileDao: FileDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  fileCooperationDao: FileCooperationDao;
  userDao: UserDao;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
    this.fileCooperationDao = new FileCooperationDao();
    this.userDao = new UserDao();
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
}
