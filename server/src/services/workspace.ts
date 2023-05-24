import { Body, Controller, Get, Post, Query, Req, Res, Request } from "@nestjs/common";
import { Request as RequestType, Response } from "express";
import FileDao from "../dao/FileDao";
import FileContentDao, { FileContentDO } from "../dao/FileContentDao";
import { EffectStatus, ExtName } from "../constants";
import FilePubDao from "../dao/filePub.dao";
import { getNextVersion } from "../utils";
import ConfigDao from "../dao/config.dao";
import UserDao from "../dao/UserDao";
import * as axios from "axios";
import FileService from '../module/file/file.controller'
import ConfigService from './config'
import { getRealDomain } from "../utils";
import UserGroupDao from "../dao/UserGroupDao"
import UploadService from '../module/upload/upload.service';
import { getAdminInfoByProjectId } from '../utils/index'

const fs = require('fs');
const path = require('path');

const folderExtnames = ['folder', 'folder-project', 'folder-module']

@Controller("/paas/api")
export default class WorkspaceService {
  fileDao: FileDao;
  configDao: ConfigDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  fileService: FileService;
  configService: ConfigService;
  userDao: UserDao;
  userGroupDao: UserGroupDao;
  uploadService: UploadService;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
    this.configDao = new ConfigDao();
    this.fileService = new FileService();
    this.configService = new ConfigService()
    this.userDao = new UserDao();
    this.userGroupDao = new UserGroupDao();
    this.uploadService = new UploadService()
  }

  @Get("/workspace/getAll")
  async getAll(@Query() query) {
    const { userId, parentId, groupId } = query;
    if (!userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const params = {
        parentId,
        groupId
      }
      if (!groupId) {
        params.creatorId = userId
      }
      const rtn = await this.fileDao.query(params);

      return {
        code: 1,
        // TODO
        data: rtn.filter((item) => {
          const { hasIcon } = item
          if (hasIcon === "1") {
            item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
          } else if (hasIcon.startsWith('http')) {
            item.icon = hasIcon
          }

          return item.extName !== "component";
        }),
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/trashes")
  async getTrashes(@Query() query) {
    const { userId } = query;
    if (!userId) {
      return { code: -1, message: "用户 ID 不能为空" };
    }

    try {
      /** 15 天 */
      const rtn = await this.fileDao.getRecycleBinFiles({
        userId,
        timeInterval: 15 * (24 * 60 * 60) * 1000,
      });

      return {
        code: 1,
        data: rtn.filter((item) => {
          const { hasIcon } = item
          if (hasIcon === "1") {
            item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
          } else if (hasIcon.startsWith('http')) {
            item.icon = hasIcon
          }

          return item.extName !== "component";
        }),
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/getFile")
  async getFile(@Query() query) {
    const { userId, fileId } = query;
    if (!userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileDao.queryById(fileId);

      return {
        code: 1,
        data: rtn,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/getFullFile")
  async getFullFile(@Query() query) {
    const { userId, fileId } = query;
    // if (!userId) {
    //   return {
    //     code: -1,
    //     message: 'error'
    //   }
    // }

    try {
      const rtn = await this.fileDao.queryById(fileId);
      const content = (await this.fileContentDao.queryBy({
        fileId: fileId,
        sortType: "desc",
        limit: 1,
        orderBy: "update_time",
      })) as any;

      return {
        code: 1,
        data: Object.assign({}, rtn, { content: content?.content }),
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/createFile")
  async createFile(@Body() body) {
    const { userId, name, extName, namespace, type, parentId, groupId } = body;
    if (!userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileDao.createFile({
        type,
        name,
        namespace,
        creatorId: userId,
        creatorName: userId,
        extName: extName,
        groupId,
        parentId,
      });
			
			if (rtn.id) {
        if(['cloud-com', 'mp-cloudcom'].includes(extName)) {
          await this.fileContentDao.create({
            fileId: rtn.id,
            content: JSON.stringify({ fileType: type }),
            version: '1.0.0',
            creatorId: userId,
            creatorName: userId,
          });
        } else if(['folder-project'].includes(extName)) {
          // 第一次安装模块，推送自带运行时代码
          await this.uploadService.saveFile({
            str: fs.readFileSync(path.join(__dirname, './SYS_AUTH.template.ts'), "utf-8"),
            filename: 'SYS_AUTH.js',
            folderPath: `/project/${rtn.id}`,
          })
	        await this.uploadService.saveFile({
		        str: fs.readFileSync(path.join(__dirname, './LOGIN.template.ts'), "utf-8"),
		        filename: 'LOGIN.js',
		        folderPath: `/project/${rtn.id}`,
	        })
	        await this.uploadService.saveFile({
		        str: fs.readFileSync(path.join(__dirname, './REGISTER.template.ts'), "utf-8"),
		        filename: 'REGISTER.js',
		        folderPath: `/project/${rtn.id}`,
	        })
          // 初始化系统超级管理员
          await this.uploadService.saveFile({
            str: JSON.stringify(getAdminInfoByProjectId(rtn.id)),
            filename: 'SYS_ADMIN_CONFIG.json',
            folderPath: `/project/${rtn.id}`,
          })
          // 发送超管登录页面
          await this.uploadService.saveFile({
            str: fs.readFileSync(path.join(__dirname, './SYS_ADMIN_LOGIN.html'), "utf-8"),
            filename: 'admin_login.html',
            folderPath: `/project/${rtn.id}`,
          })
        }
			}

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/saveFile")
  async updateFile(@Body() body) {
    try {
      let { userId, fileId, shareType, name, content, icon, namespace, type } =
        body;
      if (!userId) {
        return {
          code: -1,
          message: "error",
        };
      }

      if (
        namespace &&
        typeof namespace === "string" &&
        namespace.trim() &&
        namespace !== "_self"
      ) {
        const [fileByFileId, fileByNamespace] = await Promise.all([
          await this.fileDao.queryById(fileId),
          await this.fileDao.queryByNamespace(namespace),
        ]);

        if (!fileByNamespace && fileByFileId.namespace === "_self") {
          await this.fileDao.update({
            id: fileId,
            namespace,
            updatorId: userId,
            updatorName: userId,
          });
        }
      }

      if (type) {
        await this.fileDao.update({
          id: fileId,
          type,
          updatorId: userId,
          updatorName: userId,
        });
      }

      if (name) {
        await this.fileDao.update({
          id: fileId,
          name,
          updatorId: userId,
          updatorName: userId,
        });
      }

      if (icon) {
        await this.fileDao.update({
          id: fileId,
          icon,
          updatorId: userId,
          updatorName: userId,
        });
      }

      if (shareType !== undefined) {
        await this.fileDao.update({
          id: fileId,
          shareType,
          updatorId: userId,
          updatorName: userId,
        });
      }

      if (content) {
        const contentItem = (await this.fileContentDao.queryBy<FileContentDO>({
          fileId: fileId,
          sortType: "desc",
          limit: 1,
          orderBy: "update_time",
        })) as any;
        await this.fileContentDao.create({
          fileId,
          content,
          version: contentItem?.version
            ? getNextVersion(contentItem?.version)
            : "1.0.0",
          creatorId: userId,
          creatorName: userId,
        });
      }

      return {
        code: 1,
        data: {},
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/publish")
  async publish(@Body() body, @Req() request: RequestType) {
    try {
      let {
        extName,
        userId,
        fileId,
        content,
        commitInfo,
        type,
        fileContentId,
        projectId
      } = body;

      /** 不存在 fileContentId 则取最新一条记录 */
      if (!fileContentId) {
        const fileContent = (await this.fileContentDao.queryBy<FileContentDO>({
          fileId: fileId,
          sortType: "desc",
          limit: 1,
          orderBy: "create_time",
        })) as any;

        fileContentId = fileContent?.id || null;
      }

      let data: Record<string, unknown> = {};
      const [pub] = await this.filePubDao.getLatestPubByFileId(fileId, type);
      const version = pub?.version ? getNextVersion(pub?.version) : "1.0.0";
      let modifyContent = content;
      if (extName === ExtName.WORK_FLOW) {
        modifyContent = `
          const axios = require('axios');
          const FormData = require('form-data');
          const fileParser = require('@mybricks/file-parser');
          const renderCom = require('@mybricks/render-com-node');
          ${content}
        `;
      }
      const { id } = await this.filePubDao.create({
        fileId,
        version,
        content: modifyContent,
        type,
        commitInfo,
        creatorId: userId,
        creatorName: userId,
        fileContentId,
        projectId
      });
      data.pib_id = id;

      return {
        code: 1,
        data: data,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/publish/module")
  async publishModule(@Body() body, @Req() req) {
    const {
      fileId,
      email
    } = body;
    try {
      const [user, { projectId, moduleId }] = await Promise.all([
        await this.userDao.queryByEmail({email}),
        (await this.fileService._getParentModuleAndProjectInfo(fileId))
      ])
      // const { projectId, moduleId } = (await this.fileService._getParentModuleAndProjectInfo(fileId));
      const domainName = getRealDomain(req)

      // 先写两层，后续如果有需求改为bfs
      let validFiles = []
      const firstLevelChildren = await this.fileDao.queryAllFilesByParentId({parentId: fileId})
      let task = []
      firstLevelChildren?.forEach(file => {
        if(file.extName !== 'folder') {
          validFiles.push(file)
        } else {
          task.push(this.fileDao.queryAllFilesByParentId({parentId: file.id}))
        }
      })
      const res = await Promise.all(task)
      res?.forEach(single => {
        single?.forEach(file => {
          if(file.extName !== 'folder') {
            validFiles.push(file)
          }
        });
      })

      let publishTask = []
      const publishFiles = []
      for(let l = validFiles.length, i = 0; i < l; i++) {
        let file = validFiles[i]
        const { extName } = file;
        switch(extName) {
          case 'domain': {
            // todo: 物料接口，理论不应该让平台感知，后面通过协议暴露
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id });
            publishTask.push(
              (axios as any).post(
                `${domainName}/api/domain/publish`,
                {
                  fileId: file.id,
                  projectId: projectId,
                  userId: email,
                  json: JSON.parse(latestSave.content).toJSON
                }
              )
            );
            publishFiles.push(file)
            break;
          }
          case 'pc-page': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/pcpage/publish`, {
	            fileId: file.id,
              userId: email,
              json: JSON.parse(latestSave.content).toJSON,
            }));
            publishFiles.push(file)
            break;
          }
          case 'cloud-com': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/cloudcom/publish`, {
	            fileId: file.id,
              userId: email,
              json: JSON.parse(latestSave.content).toJSON,
            }));
            publishFiles.push(file)
            break;
          }
        }
      }

      // await Promise.all(publishTask);

      const [[pub]] = await Promise.all([
        await this.filePubDao.getLatestPubByFileId(fileId, 'prod'),
        ...publishTask
      ])

      const version = pub?.version ? getNextVersion(pub?.version) : "1.0.0";
      await this.filePubDao.create({
        fileId,
        version,
        content: JSON.stringify({
          files: publishFiles.map((file) => {
            return {id: file.id}
          })
        }),
        type: 'prod',
        // commitInfo,
        creatorId: user.email,
        creatorName: user.name || user.email,
        // fileContentId
      });
			
      return {
        code: 1,
        data: null
      }
    } catch(e) {
      return {
        code: -1,
        msg: e.message
      }
    }
  }

  @Get("/workspace/save/versions")
  async getSaveVersions(@Query() query) {
    const { fileId, pageIndex, pageSize } = query;
    const data = await this.fileContentDao.getContentVersions({
      fileId,
      limit: Number(pageSize),
      offset: (Number(pageIndex) - 1) * Number(pageSize),
    });

    return { code: 1, data };
  }

  @Get("/workspace/publish/versions")
  async getPublishVersions(@Query() query) {
    const { fileId, pageIndex, pageSize, type } = query;
    const filePubs = await this.filePubDao.getContentVersions({
      fileId,
      limit: Number(pageSize),
      offset: (Number(pageIndex) - 1) * Number(pageSize),
      type,
    });

    // const fileContentIds = filePubs
    //   .filter((t) => t.fileContentId)
    //   .map((t) => t.fileContentId);

    // if (Array.isArray(fileContentIds) && fileContentIds.length) {
    //   let fileContents = await this.fileContentDao.queryBy({
    //     ids: fileContentIds,
    //   });

    //   // 兼容单个查询不为数组的情况
    //   // @ts-ignore
    //   if (fileContents?.id) {
    //     fileContents = [fileContents];
    //   }

    //   if (Array.isArray(fileContents) && fileContents.length) {
    //     const fileContentMap = new Map();
    //     fileContents.forEach((content) => {
    //       fileContentMap.set(content.id, content);
    //     });

    //     filePubs.forEach((filePub) => {
    //       if (
    //         filePub?.fileContentId &&
    //         fileContentMap.has(filePub.fileContentId)
    //       ) {
    //         // @ts-ignore
    //         filePub.fileContentInfo = fileContentMap.get(filePub.fileContentId);
    //       }
    //     });
    //   }
    // }

    return { code: 1, data: filePubs };
  }

  @Get("/workspace/publish/content")
  async getPublishByFileId(@Query() query) {
    const { id } = query;
    const [data] = await this.filePubDao.getPublishByFileId(id);

    return { code: 1, data: data ?? null };
  }

  @Post("/workspace/file/revert")
  async revertFile(@Body() body) {
    const { fileContentId, filePubId, userId } = body;
    if (!filePubId && !fileContentId) {
      return { code: 0, message: "filePubId 或 fileContentId 不能为空" };
    }

    if (fileContentId) {
      const [fileContent] = await this.fileContentDao.queryById({
        id: fileContentId,
      });

      if (!fileContent) {
        return { code: 0, message: "保存记录不存在" };
      }
      await this.fileContentDao.create({
        fileId: fileContent.fileId,
        content: fileContent.content,
        version: getNextVersion(fileContent?.version || "1.0.0"),
        creatorId: userId,
        creatorName: userId,
      });
    } else if (filePubId) {
      const [filePub] = await this.filePubDao.getPublishByFileId(filePubId);

      if (!filePub) {
        return { code: 0, message: "发布记录不存在" };
      }
      if (!filePub.fileContentId) {
        return { code: 0, message: "保存记录不存在" };
      }

      const [fileContent] = await this.fileContentDao.queryById({
        id: filePub.fileContentId,
      });

      if (!fileContent) {
        return { code: 0, message: "保存记录不存在" };
      }

      await this.fileContentDao.create({
        fileId: fileContent.fileId,
        content: fileContent.content,
        version: getNextVersion(fileContent?.version || "1.0.0"),
        creatorId: userId,
        creatorName: userId,
      });
    }

    return { code: 1, message: "回滚成功" };
  }

  @Post("/workspace/deleteFile")
  async deleteFile(@Body() body, @Request() request) {
    const { id, userId } = body;
    if (!id || !userId) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
	    const file = await this.fileDao.queryById(id);
      const rtn = await this.fileDao.deleteFile({
        id,
        updatorId: userId,
        updatorName: userId,
      });
			
			try {
				/** 删除领域模型资源，如实体表、服务接口等 TODO: 项目级别资源删除 */
				if (file?.extName === 'domain') {
					const domainName = getRealDomain(request);
					
					(axios as any).post(`${domainName}/api/domain/deleteFile`, { fileId: id, userId });
				}
			} catch (e) {
				console.log('删除领域模型资源失败', e);
			}

      return {
        code: 1,
        data: { id: rtn.id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post("/workspace/recoverFile")
  async recoverFile(@Body() body) {
    const { id, userId } = body;
    if (!id || !userId) {
      return { code: -1, message: "userId、id 不能为空" };
    }

    try {
      await this.fileDao.recoverFile({
        id,
        updatorId: userId,
        updatorName: userId,
      });

      return { code: 1, data: null };
    } catch (ex) {
      return { code: -1, message: ex.message };
    }
  }

  @Get("/workspace/checkNamespaceUsedByCdm")
  async checkNamespaceUsedByCdm(@Query() query) {
    const { namespace } = query;
    if (!namespace) {
      return {
        code: -1,
        message: "error",
      };
    }

    try {
      const rtn = await this.fileDao.queryByNamespace(namespace);

      return {
        code: rtn ? -1 : 1,
        data: null,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/workspace/getPubVersionByFileId")
  async getPubVersionByFileId(@Query() query) {
    const [pub] = await this.filePubDao.getLatestPubByFileId(query.fileId);
    const version = pub?.version || "1.0.0";
    return {
      code: 1,
      data: version,
    };
  }

  /**
   * 获取图标，直接使用在image标签的src
   * ```js
   * <img src="api/workspace/getFileIcon?fileId=xxx"/>
   * ```
   */
  @Get("/workspace/getFileIcon")
  async getFileIcon(@Query() query, @Res() res: Response) {
    try {
      const file = await this.fileDao.queryIconById(query.fileId, [
        EffectStatus.EFFECT,
        EffectStatus.DELETE,
      ]);
      const base64 = file.icon.replace(/^data:image\/\w+;base64,/, "");
      const dataBuffer = new Buffer(base64, "base64");

      res.end(dataBuffer);
    } catch (ex) {
      res.end(ex.message);
    }
  }

  @Get("/workspace/getFilePath")
  async getFilePath(@Query() query) {
    const { fileId, userId } = query;
    const path = [];

    // let file = await this.fileDao.queryById(fileId);
    // let [file] = await this.fileDao.getFiles({ id: fileId, creatorId: userId });
    let [file] = await this.fileDao.getFiles({ id: fileId });

    if (file) {
      let { extName, parentId } = file;

      if (folderExtnames.includes(extName)) {
        path.unshift(file);

        while (parentId) {
          file = await this.fileDao.queryById(parentId);
          parentId = file?.parentId;

          path.unshift(file);
        }
      }
    }

    return {
      code: 1,
      data: path,
    };
  }

  @Get("/workspace/globalSearch")
  async globalSearch(@Query() query) {
    const {
      name,
      userId,
      limit,
      offset
    } = query;
    const list: any = await this.fileDao.globalSearch({
      name,
      userId,
      limit: Number(limit),
      offset: Number(offset)
    });

    const path = await Promise.all(
      list.map((item) => {
        const { shareType, groupId, creatorId } = item;
        return new Promise((resolve) => {
          if (shareType === 1 && !groupId && creatorId !== userId) {
            resolve([{id: 0, name: '大家的分享', extName: 'share'}]);
          } else {
            this.getPath(item).then((path) => {
              resolve(path);
            });
          }
        });
      })
    );

    return {
      code: 1,
      data: {
        list,
        path
      }
    }
  }

  async getPath(file) {
    return new Promise(async (resolve) => {
      const path = [];
      let { parentId, extName, groupId } = file;
      if (extName === "group") {
        path.push(file);
      } else {
        while (parentId) {
          const parent = await this.fileDao.queryById(parentId);
          if (parent) {
            path.unshift(parent);
            parentId = parent.parentId;
          } else {
            parentId = null;
          }
        }
        if (groupId) {
          const group = await this.userGroupDao.queryById({id: groupId});
          path.unshift(group);
        } else {
          path.unshift(null);
        }
      }

      resolve(path);
    });
  }
}
