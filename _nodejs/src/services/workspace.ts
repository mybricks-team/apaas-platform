import {Body, Res, Controller, Get, Post, Query, Req} from '@nestjs/common';
import { Request, Response } from 'express';
import FileDao from "../dao/FileDao";
import FileContentDao, {FileContentDO} from "../dao/FileContentDao";
import {ExtName} from "../constants";
import FilePubDao from "../dao/filePub.dao";
import * as axios from "axios";
import {getNextVersion} from "../utils";
import ConfigDao from "../dao/config.dao";

@Controller('api')
export default class WorkspaceService {
  fileDao: FileDao;
	configDao: ConfigDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
	  this.configDao = new ConfigDao();
  }

  @Get('/workspace/getAll')
  async getAll(@Query() query) {
    const {userId, parentId} = query
    if (!userId) {
      return {
        code: -1,
        message: 'error'
      }
    }

    try {
      const rtn = await this.fileDao.query({creatorId: userId, parentId})

      return {
        code: 1,
        // TODO
        data: rtn.filter(item => {
          if (item.hasIcon === '1') {
            item.icon = `/api/workspace/getFileIcon?fileId=${item.id}`;
          }
          
          return item.extName !== 'component';
        })
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Get('/workspace/getFile')
  async getFile(@Query() query) {
    const {userId, fileId} = query
    if (!userId) {
      return {
        code: -1,
        message: 'error'
      }
    }

    try {
      const rtn = await this.fileDao.queryById(fileId)

      return {
        code: 1,
        data: rtn
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Get('/workspace/getFullFile')
  async getFullFile(@Query() query) {
    const {userId, fileId} = query
    // if (!userId) {
    //   return {
    //     code: -1,
    //     message: 'error'
    //   }
    // }

    try {
      const rtn = await this.fileDao.queryById(fileId)
      const content = await this.fileContentDao.queryBy({
	      fileId: fileId,
	      sortType: 'desc',
	      limit: 1,
        orderBy: 'update_time',
			}) as any

      return {
        code: 1,
        data: Object.assign({}, rtn, {content: content?.content})
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Post('/workspace/createFile')
  async createFile(@Body() body) {
    const {userId,name,appType, namespace, type,parentId} = body
    if (!userId) {
      return {
        code: -1,
        message: 'error'
      }
    }

    try {
      const rtn = await this.fileDao.createFile({
        type,
        name,
        namespace,
        creatorId: userId,
        creatorName: userId,
        extName: appType,
        groupId: null,
        parentId
      })

      return {
        code: 1,
        data: {id: rtn.id}
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Post('/workspace/saveFile')
  async updateFile(@Body() body) {
    try {
      let {userId, fileId, shareType, name, content, icon, namespace, type} = body
      if (!userId) {
        return {
          code: -1,
          message: 'error'
        }
      }

      if (namespace) {
        await this.fileDao.update({id: fileId, namespace, updatorId: userId, updatorName: userId})
      }

      if (type) {
        await this.fileDao.update({id: fileId, type, updatorId: userId, updatorName: userId})
      }

      if (name) {
        await this.fileDao.update({id: fileId, name, updatorId: userId, updatorName: userId})
      }

      if (icon) {
        await this.fileDao.update({id: fileId, icon, updatorId: userId, updatorName: userId})
      }

      if (shareType !== undefined) {
        await this.fileDao.update({id: fileId, shareType, updatorId: userId, updatorName: userId})
      }

      if (content) {
        const contentItem = await this.fileContentDao.queryBy<FileContentDO>({
	        fileId: fileId,
	        sortType: 'desc',
	        limit: 1,
          orderBy: 'update_time',
				}) as any;
	      await this.fileContentDao.create({
		      fileId,
		      content,
		      version: getNextVersion(contentItem?.version || '1.0.0'),
		      creatorId: userId,
		      creatorName: userId
	      });
      }

      return {
        code: 1,
        data: {}
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Post('/workspace/publish')
  async publish(@Body() body, @Req() request: Request) {
    try {
			const { extName, userId, fileId, content, commitInfo, type, fileContentId } = body;
			
			let data: Record<string, unknown> = {};
			const [pub] = await this.filePubDao.getLatestPubByFileId(fileId, type);
			const version = getNextVersion(pub?.version || '1.0.0');
      let modifyContent = content;
      if(extName === ExtName.WORK_FLOW) {
        modifyContent =  `
          const axios = require('axios');
          const FormData = require('form-data');
          ${content}
        `
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
	    });
	    data.pib_id = id;
 
	    if (extName === ExtName.CLOUD_COM) {
				try {
					const [config = {}] = await this.configDao.getConfig({
            namespace: [ExtName.CLOUD_COM]
          });
          // @ts-ignore
					const materialRes = await axios.post(
						(request.secure ? 'https://' : 'http://') + request.headers.host + '/material/api/material/component/create',
						{ component: { ...body, emial: userId, version }, config }
					);

          data = { ...data, ...((materialRes.data.data ? materialRes.data.data : materialRes.data) || {}) };
				} catch (err) {
          console.log(err, 'err')
        }
	    }

      return {
        code: 1,
        data: data
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }
	
	@Get('/workspace/save/versions')
	async getSaveVersions(@Query() query) {
		const { fileId, pageIndex, pageSize } = query;
		const data = await this.fileContentDao.getContentVersions({ fileId, limit: Number(pageSize), offset: (Number(pageIndex) - 1) * Number(pageSize) });
		
		return { code: 1, data };
	}
	
	@Get('/workspace/publish/versions')
	async getPublishVersions(@Query() query) {
		const { fileId, pageIndex, pageSize, type } = query;
		const data = await this.filePubDao.getContentVersions({ fileId, limit: Number(pageSize), offset: (Number(pageIndex) - 1) * Number(pageSize), type });
		
		return { code: 1, data };
	}
	
	@Get('/workspace/publish/content')
	async getPublishByFileId(@Query() query) {
		const { id } = query;
		const [data] = await this.filePubDao.getPublishByFileId(id);
		
		return { code: 1, data: data ?? null };
	}
	
	@Post('/workspace/file/revert')
	async revertFile(@Body() body) {
		const { fileContentId, filePubId, userId } = body;
		if (!filePubId && !fileContentId) {
			return { code: 0, message: 'filePubId 或 fileContentId 不能为空' };
		}
		
		if (fileContentId) {
			const [fileContent] = await this.fileContentDao.queryById({ id: fileContentId });
			
			if (!fileContent) {
				return { code: 0, message: '保存记录不存在' };
			}
			await this.fileContentDao.create({
				fileId: fileContent.fileId,
				content: fileContent.content,
				version: getNextVersion(fileContent?.version || '1.0.0'),
				creatorId: userId,
				creatorName: userId
			});
		} else if (filePubId) {
			const [filePub] = await this.filePubDao.getPublishByFileId(filePubId);
			
			if (!filePub) {
				return { code: 0, message: '发布记录不存在' };
			}
			if (!filePub.fileContentId) {
				return { code: 0, message: '保存记录不存在' };
			}
			
			const [fileContent] = await this.fileContentDao.queryById({ id: filePub.fileContentId });
			
			if (!fileContent) {
				return { code: 0, message: '保存记录不存在' };
			}
			
			await this.fileContentDao.create({
				fileId: fileContent.fileId,
				content: fileContent.content,
				version: getNextVersion(fileContent?.version || '1.0.0'),
				creatorId: userId,
				creatorName: userId
			});
		}
		
		return { code: 1, message: '回滚成功' };
	}

  @Post('/workspace/deleteFile')
  async deleteFile(@Body() body) {
    const {id, userId} = body
    if (!id || !userId) {
      return {
        code: -1,
        message: 'error'
      }
    }

    try {
      const rtn = await this.fileDao.deleteFile({
        id,
        updatorId: userId,
        updatorName: userId
      })

      return {
        code: 1,
        data: {id: rtn.id}
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Get('/workspace/checkNamespaceUsedByCdm')
  async checkNamespaceUsedByCdm(@Query() query) {
    const { namespace } = query;
    if (!namespace) {
      return {
        code: -1,
        message: 'error'
      }
    }

    try {
      const rtn = await this.fileDao.queryByNamespace(namespace)

      return {
        code: rtn ? -1 : 1,
        data: null
      }
    } catch (ex) {
      return {
        code: -1,
        message: ex.message
      }
    }
  }

  @Get('/workspace/getPubVersionByFileId')
  async getPubVersionByFileId(@Query() query) {
    const [pub] = await this.filePubDao.getLatestPubByFileId(query.fileId);
		const version = pub?.version || '1.0.0';
    return {
      code: 1,
      data: version
    }
  }

  /** 
   * 获取图标，直接使用在image标签的src 
   * ```js
   * <img src="api/workspace/getFileIcon?fileId=xxx"/>
   * ```
   */
  @Get('/workspace/getFileIcon')
  async getFileIcon(@Query() query, @Res() res: Response,) {
    try {
      const file = await this.fileDao.queryById(query.fileId);
      const base64 = file.icon.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = new Buffer(base64, 'base64');

      res.end(dataBuffer);
    } catch (ex) {
      res.end(ex.message);
    }
  }

  @Get('/workspace/getFilePath')
  async getFilePath(@Query() query) {
    const { fileId, userId } = query;
    const path = [];

    // let file = await this.fileDao.queryById(fileId);
    let [file] = await this.fileDao.getFiles({id: fileId, creatorId: userId});

    if (file) {
      let { extName, parentId } = file;

      if (extName === 'folder') {
        path.unshift({id: file.id, name: file.name, parentId});

        while (parentId) {
          file = await this.fileDao.queryById(parentId);
          parentId = file?.parentId;

          path.unshift({id: file.id, name: file.name, parentId});
        }
      }
    }

    return {
      code: 1,
      data: path
    }
  }
}