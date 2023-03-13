import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  UploadedFile,
} from '@nestjs/common';
import * as axios from "axios";
import ModuleService from './module.service';
import FileService from './../file/file.controller';
import UserDao from './../../dao/UserDao';
import FileDao from './../../dao/FileDao';
import FileContentDao from './../../dao/FileContentDao';
import FilePubDao from './../../dao/filePub.dao';
const env = require('../../../env.js')
import { getRealDomain, getNextVersion } from '../../utils/index'

@Controller('/paas/api/module')
export default class ModuleController {
  userDao: UserDao;
  fileDao: FileDao;
  fileService: FileService;
  moduleService: ModuleService;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;

  constructor() {
    this.userDao = new UserDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();

    this.fileService = new FileService();
    this.moduleService = new ModuleService();
    this.fileDao = new FileDao();
  }

  @Get('/test')
  async test(@Request() request) {
    const domainName = getRealDomain(request)
    console.log('----')
    console.log(request.headers)
    console.log(domainName)
    return {
      code: 1
    }
  }

  @Post('/publish')
  async publish(@Request() request, @Body() body) {
    const { email, fileId, commitInfo } = body;

    try {
      const [user, file, { projectId }] = await Promise.all([
        await this.userDao.queryByEmail({ email }),
        await this.fileDao.queryById(fileId),
        await this.fileService._getParentModuleAndProjectInfo(fileId)
      ])

      const domainName = getRealDomain(request)

      const flattenFiles = await this.fileDao.queryFlattenFileTreeByParentId({ parentId: fileId })
      // 先写两层，后续如果有需求改为bfs
      // const firstLevelChildren = await this.fileDao.queryAllFilesByParentId({parentId: fileId})
      // let task = []
      // /** 记录task的parentId */
      // firstLevelChildren?.forEach(file => {
      //   if(file.extName !== 'folder') {
      //     validFiles.push(file)
      //   } else {
      //     validFiles.push(file)
      //     task.push(this.fileDao.queryAllFilesByParentId({parentId: file.id}))
      //   }
      // })
      // const res = await Promise.all(task)
      // res?.forEach(single => {
      //   single?.forEach((file) => {
      //     if(file.extName !== 'folder') {
      //       validFiles.push(file)
      //     } else {
      //       validFiles.push(file)
      //     }
      //   });
      // })

      let publishTask = []
      /** 存储fileId和publishTask的索引关系 */
      const publishTaskIndexMap = {}
      const publishFiles = []
      for(let l = flattenFiles.length, i = 0; i < l; i++) {
        let file = flattenFiles[i]
        const { extName } = file;
        switch(extName) {
          case 'domain': {
            // todo: 物料接口，理论不应该让平台感知，后面通过协议暴露
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id });
            publishTask.push(
              (axios as any).post(
                `${domainName}/api/domain/generateServiceCode`,
                {
                  fileId: file.id,
                  // projectId: projectId,
                  projectId: '--slot-project-id--',
                  userId: email,
                  json: JSON.parse(latestSave.content).toJSON
                }
              ).then(res => {
                if (res?.data?.code === 1 && res?.data?.data) {
                  if (typeof res?.data?.data?.bundle !== 'string') {
                    throw new Error(`编译${file.name}(${file.id}).${extName}失败，产物格式不正确`)
                  }
                  return {
                    extName: res?.data?.data?.ext_name,
                    bundle: res?.data?.data?.bundle,
                  }
                } else {
                  throw new Error(`编译${file.name}(${file.id}).${extName}失败，${res?.data?.message ?? '服务异常'}`)
                }
              })
            );
            publishTaskIndexMap[file.id] = publishTask.length - 1
            publishFiles.push(file)
            break;
          }
          case 'pc-page': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/pcpage/generateHTML`, {
	            fileId: file.id,
              userId: email,
              json: JSON.parse(latestSave.content).toJSON,
            }).then(res => {
              if (res?.data?.code === 1 && res?.data?.data) {
                if (typeof res?.data?.data?.bundle !== 'string') {
                  throw new Error(`编译${file.name}(${file.id}).${extName}失败，产物格式不正确`)
                }
                return {
                  extName: res?.data?.data?.ext_name,
                  bundle: res?.data?.data?.bundle,
                }
              } else {
                throw new Error(`编译${file.name}(${file.id}).${extName}失败，${res?.data?.message ?? '服务异常'}`)
              }
            }));
            publishTaskIndexMap[file.id] = publishTask.length - 1
            publishFiles.push(file)
            break;
          }
          case 'cloud-com': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/cloudcom/publish`, {
	            fileId: file.id,
              userId: email,
              json: JSON.parse(latestSave.content).toJSON,
            }).then(res => {
              if (res?.data?.code === 1 && res?.data?.data) {
                return {
                  extName: res?.data?.data?.extName,
                  bundle: res?.data?.data?.bundle,
                }
              } else {
                throw new Error(`编译${file.name}(${file.id}).${extName}失败，${res?.data?.message ?? '服务异常'}`)
              }
            }));
            publishTaskIndexMap[file.id] = publishTask.length - 1
            publishFiles.push(file)
            break;
          }

          /** 不需要编译的类型 */
          default: {
            publishFiles.push(file)
            break;
          }
        }
      }

      /** 构建产物 */
      const publishTaskResult = await Promise.all(publishTask)


      /** 插入module记录 */
      const [pub] = await this.moduleService.getLatestPubByFileId(fileId);
      const version = pub?.version ? getNextVersion(pub?.version) : "1.0.0";

      const id = await this.moduleService.create({
        name: file?.name,
        description: file?.description,
        version,
        originFileId: fileId,
        creatorId: user.email,
        creatorName: user.name || user.email,
      });

      /** 插入module_pub_info记录 */
      await this.moduleService.batchCreatePubInfo({
        moduleId: id,
        pubContentList: publishFiles.map(file => {
          /** 找到构建后产物 */
          const compiledBundle = publishTaskResult[publishTaskIndexMap[file?.id]]
          return {
            content: compiledBundle?.bundle,
            extName: compiledBundle?.extName,
            fileName: file.name,
            fileId: file.id,
            parentId: file.parentId
          }
        }),
        commitInfo: commitInfo ?? '',
        version,
        creatorId: user.email,
        creatorName: user.name || user.email,
      })

      return {
        data: {
          succeedFiles: publishFiles
        },
        msg: '发布模块成功',
        code: 1,
      };
    } catch (err) {
      return {
        code: -1,
        msg: `${err?.message ?? '服务异常'}`,
      };
    }
  }

  @Get('/publish/getVersionsByFileId') 
  async getVersionsByFileId(@Query() query) {
    const { id, pageIndex, pageSize } = query
    const versions = await this.moduleService.queryByFileId({ fileId: id, pageIndex, pageSize })

    return {
      code: 1,
      data: versions
    }
  }
	
	@Get('/list')
	async getModuleList() {
		const moduleList = await this.moduleService.getModuleList();
		
		return { code: 1, data: moduleList };
	}
	
	@Post('/install')
	async installModule(@Body() body, @Request() request) {
		const { id, projectId, userId } = body;
		
		if (!id || !projectId) {
			return { code: 0, message: '参数 id、projectId 不能为空' };
		}
		
		return await this.moduleService.installModule({ id, projectId, userId }, request);
	}
}
