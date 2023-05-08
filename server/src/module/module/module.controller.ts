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
import UploadService from '../upload/upload.service';

@Controller('/paas/api/module')
export default class ModuleController {
  userDao: UserDao;
  fileDao: FileDao;
  fileService: FileService;
  moduleService: ModuleService;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;
  uploadService: UploadService;

  constructor() {
    this.userDao = new UserDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();

    this.fileService = new FileService();
    this.moduleService = new ModuleService();
    this.fileDao = new FileDao();
    this.uploadService = new UploadService()
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

      const flattenFiles = await this.fileDao.queryFlattenFileTreeByParentId({ parentId: fileId });
			const domainFileContentMap = {};
	    for (let i = 0; i < flattenFiles.length; i++) {
		    let file = flattenFiles[i];
		    const { extName, id, name } = file;
				
				if (extName === 'domain') {
					const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id });
					domainFileContentMap[id] = latestSave;
					
					const json = JSON.parse(latestSave?.content ?? '{}').toJSON;
					
					if (!json) {
						continue;
					}
					if (json.hasError) {
						return { code: -1, msg: `领域模型【${name}】中服务面板中存在错误，请确认后重新发布` };
					}
					for (let i = 0; i < json.service.length; i++) {
						const service = json.service[i];
						
						const returnCon = service.diagrams?.[0].conAry.find(item => item.to.parent.type === 'frame' && item.to.id === 'response');
						
						if (!returnCon) {
							return { code: -1, msg: `领域模型【${name}】中的服务面板中【${service.title}】未连接到返回节点，请确认后重新发布` };
						}
					}
				}
	    }

      let publishTask = []
      /** 存储fileId和publishTask的索引关系 */
      const publishTaskIndexMap = {}
      const publishFiles = []
      for (let l = flattenFiles.length, i = 0; i < l; i++) {
        let file = flattenFiles[i]
        const { extName } = file;
        switch (extName) {
          case 'domain': {
            const latestSave = domainFileContentMap[file.id];
            publishTask.push(
              (axios as any).post(
                `${domainName}/api/domain/generateServiceCode`,
                {
                  fileId: file.id,
                  // projectId: projectId,
                  projectId: '--slot-project-id--',
                  userId: email,
                  json: JSON.parse(latestSave?.content ?? '{}').toJSON
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
              json: JSON.parse(latestSave?.content ?? '{}').toJSON,
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
          case 'mp-page': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/mppage/compile`, {
              fileId: file.id,
              userId: email,
              json: JSON.parse(latestSave?.content ?? '{}'),
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
          case 'mp-cloudcom': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/mpcloudcom/compile`, {
              fileId: file.id,
              userId: email,
              json: JSON.parse(latestSave.content).toJSON || {},
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
                console.log("=============");
                console.log(res.data.message);
                console.log("=============");

                throw new Error(`编译${file.name}(${file.id}).${extName}失败，${res?.data?.message ?? '服务异常'}`)
              }
            }));
            publishTaskIndexMap[file.id] = publishTask.length - 1
            publishFiles.push(file)
            break;
          }
          case 'cloud-com': {
            const latestSave = await this.fileContentDao.queryLatestSave({ fileId: file.id })
            publishTask.push((axios as any).post(`${domainName}/api/cloudcom/generateComponentCode`, {
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
          /** 不需要编译的类型 */
          default: {
            /** 直接返回原来文件的extName */
            publishTask.push(Promise.resolve({ extName: file.extName }))
            publishTaskIndexMap[file.id] = publishTask.length - 1
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

    const installedModules = await this.moduleService.getProjectModuleInfo(projectId)

    if (!id || !projectId) {
      return { code: 0, message: '参数 id、projectId 不能为空' };
    }

    return await this.moduleService.installModule({ id, projectId, userId }, request);
  }

  @Post('/getLatestFileList')
  async getLatestFileList(@Body('moduleId') moduleId: number, @Body('parentId') parentId: number) {

    if (!moduleId) {
      return { code: 0, message: '参数 moduleId 不能为空' };
    }
    const res = await this.moduleService.getLatestFileList({ moduleId, parentId });
    return {
      code: 1,
      data: res
    }
  }

  @Post('/getLatestModulePubByProjectId')
  async getLatestModulePubByProjectId(@Body('projectId') projectId: number, @Body('extNameList') extNameList: string[]) {
    try {
      const res = await this.moduleService.getLatestModulePubByProjectId({ projectId, extNameList })
      return {
        code: 1,
        data: res
      }
    } catch (e) {
      return {
        code: -1,
        msg: e.message || '出错了'
      }
    }
  }
}
