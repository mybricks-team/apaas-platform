import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  UseInterceptors,
  UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { Logger } from '@mybricks/rocker-commons';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
const env = require('../../../env.js')
import { getRealDomain, uuid } from '../../utils'
import FlowService from './flow.service';
import * as path from 'path';
import * as fs from 'fs';
import { removeFile } from '../../utils/file';


@Controller('/paas/api/flow')
export default class FlowController {
  flowService: FlowService;

  constructor() {
    this.flowService = new FlowService();
  }

  // 模块安装时，发布到运行容器
  @Post('/file/batchCreate')
  async batchCreateProjectFile(
    @Body('projectId') projectId: number,
    @Body('envType') envType: number,
    @Body('codeStrList') codeStrList: {fileId: number, fileName: string, content: string}[],
    @Request() request,
  ) {
    const domainName = getRealDomain(request)
    if(!codeStrList) {
      return {
        code: -1,
        msg: 'fileId 或 codeStrList 为空'
      }
    }
    try {
      const cdnList = await this.flowService.batchCreateProjectFile({
        projectId,
        envType,
        codeStrList
      }, { domainName })
      
      return {
        code: 1,
        data: cdnList
      }
    } catch (err) {
      return {
        code: -1,
        msg: err.message || '出错了'
      }
    }
  }

  // 模块安装时，删除历史存量页面
  @Post('/file/batchDeleteService')
  async batchDeleteServiceFileOfProject(
    @Body('projectId') projectId: number,
    @Body('serviceList') serviceList: {fileId: number, serviceId: string}[]
  ) {
    if(!serviceList) {
      return {
        code: -1,
        msg: 'fileId 或 codeStrList 为空'
      }
    }
    try {
      await this.flowService.batchDeleteServiceFileOfProject({
        projectId,
        serviceList
      })
      
      return {
        code: 1,
        msg: '删除完毕'
      }
    } catch (err) {
      return {
        code: -1,
        msg: err.message || '出错了'
      }
    }
  }

  // 模块安装时，查询正在提供服务的文件
  @Post('/file/getOnlineServiceOfProjectAndFile')
  async getOnlineServiceOfProjectAndFile(
    @Body('projectId') projectId: number,
    @Body('domainFileId') domainFileId: number
  ) {
    if(!projectId || !domainFileId) {
      return {
        code: -1,
        msg: 'domainFileId 或 domainFileId 为空'
      }
    }
    try {
      const files = await this.flowService.getOnlineServiceOfProjectAndFile({
        projectId,
        domainFileId
      })
      
      return {
        code: 1,
        data: files
      }
    } catch (err) {
      return {
        code: -1,
        msg: err.message || '出错了'
      }
    }
  }
  

  @Post('/saveFile')
  @UseInterceptors(FileInterceptor('file'))
  async saveFile(@Request() request, @Body() body, @UploadedFile() file) {
    const domainName = body?.domainName || getRealDomain(request)
    Logger.info(`[API][/paas/api/flow/saveFile]saveFile请求头是: ${domainName}`)
    try {
      const subPath = await this.flowService.saveFile({
        str: file.buffer,
        filename: body.noHash ? file.originalname : `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
        folderPath: body.folderPath
      });
      return {
        data: {
          url: `${domainName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`,
          subPath,
        },
        code: 1,
      };
    } catch (err) {
      return {
        code: -1,
        msg: `上传失败: ${err}`,
      };
    }
  }

  @Post('/saveFiles')
  @UseInterceptors(FilesInterceptor('files[]'))
  async saveFiles(@Request() request, @Body() body, @UploadedFiles() file) {
    try {
      const domainName = getRealDomain(request)
      Logger.info(`[API][/paas/api/flow/saveFiles]: saveFiles请求头是: ${domainName}`)
      let files = file || [];
      if (!Array.isArray(files)) {
        files = [files];
      }
      const cdnList = await Promise.all(
        files.map((file) => {
          return this.flowService.saveFile({
            str: file.buffer,
            // filename: file.originalname,
            filename: body.noHash ? file.originalname : `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
            folderPath: body.folderPath
          });
        }),
      );
      if (
        Array.isArray(cdnList) &&
        cdnList.length &&
        !cdnList.some((url) => !url)
      ) {
        return {
          data: cdnList?.map((subPath) => {
            return `${domainName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`
          }),
          code: 1,
        };
      }
    } catch (err) {
      return {
        code: -1,
        msg: `上传失败: ${err}`,
      };
    }
    return {
      code: -1,
      msg: `上传失败`,
    };
  }

  @Post('/uploadAsset')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadAsset(@Body() body, @UploadedFiles() files) {
    try {
      const { hash, path: folderPath = './', filePathMap } = body;
      if (!Array.isArray(files) || !files.length) {
        return { code: -1, msg: '参数 files 必须为数组，且不能为空' };
      }
      const rootFile = path.join(env.FILE_LOCAL_STORAGE_FOLDER, folderPath);

      if (!rootFile.startsWith(env.FILE_LOCAL_STORAGE_FOLDER)) {
        return { code: -1, msg: '无法访问非静态文件目录' };
      }

      const curFilePathMap = filePathMap ? JSON.parse(filePathMap) : [];
      const cdnList = await Promise.all(
        files.map((file, index) => {
          let curFolderPath = folderPath;

          if (curFilePathMap?.[index]) {
            const joinPath = curFilePathMap[index].split('/').slice(0, -1).join('/');
            joinPath && (curFolderPath += (folderPath.endsWith('/') ? '' : '/') + joinPath);
          }

          return this.flowService.saveFile({
            str: file.buffer,
            filename: hash && JSON.parse(hash) ? `${uuid()}-${new Date().getTime()}-${file.originalname}` : file.originalname,
            folderPath: curFolderPath
          });
        }),
      );

      if (Array.isArray(cdnList) && cdnList.length && !cdnList.some((url) => !url)) {
        return {
          data: cdnList?.map((subPath) => `/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath.replace(/^\.\//, '/')}`),
          code: 1,
        };
      }
    } catch (err) {
      return { code: -1, msg: `上传失败: ${err}` };
    }

    return { code: -1, msg: `上传失败` };
  }

  @Post('/createCategory')
  async createCategory(@Body() body) {
    const { path: filePath = './', name } = body;
    const rootFile = path.join(env.FILE_LOCAL_STORAGE_FOLDER, filePath);

    if (!rootFile.startsWith(env.FILE_LOCAL_STORAGE_FOLDER)) {
      return { code: -1, msg: '无法访问非静态文件目录' };
    }

    if (fs.existsSync(path.join(rootFile, name))) {
      return { code: -1, msg: '该目录下已存在同名目录' };
    }

    fs.mkdirSync(path.join(rootFile, name));

    return { code: 1, msg: '创建成功' };
  }

  @Get('/getAsset')
  async getFiles(@Query() query) {
    try {
      if(!fs.existsSync(env.FILE_LOCAL_STORAGE_FOLDER)) {
        Logger.info('[API][/paas/api/flow/getAsset]: 文件夹不存在，创建文件夹')
        fs.mkdirSync(env.FILE_LOCAL_STORAGE_FOLDER)
      }
      const { path: filePath = './', pageNum = 1, pageSize = 20 } = query;
      const rootFile = path.join(env.FILE_LOCAL_STORAGE_FOLDER, filePath);

      if (!rootFile.startsWith(env.FILE_LOCAL_STORAGE_FOLDER)) {
        return { code: -1, msg: '无法访问非静态文件目录' };
      }

      const files = fs.readdirSync(rootFile);
      const fileInfos = files
        .map(file => {
          const info = fs.statSync(path.join(rootFile, file));
          (info as any).name = file;

          return info;
        })
        .sort((statA, statB) => {
          if (statA.isDirectory() && !statB.isDirectory()) {
            return -1;
          }
          if ((statA.isDirectory() && statB.isDirectory()) || (!statA.isDirectory() && !statB.isDirectory())) {
            return statB.mtimeMs * 1000 - statA.mtimeMs * 1000;
          }
          if (!statA.isDirectory() && statB.isDirectory()) {
            return 1;
          }

          return 0;
        });

      const startIndex = pageSize * (pageNum - 1);
      let prefix = `/${env.FILE_LOCAL_STORAGE_PREFIX}${rootFile.replace(env.FILE_LOCAL_STORAGE_FOLDER, '')}`;
      prefix += prefix.endsWith('/') ? '' : '/';

      return {
        code: 1,
        data: {
          pageNum,
          pageSize,
          dataSource: fileInfos.slice(startIndex, startIndex + pageSize).map(file => {
            const name = (file as any).name;

            return {
              name: name,
              type: file.isDirectory() ? 'folder' : 'file',
              updateTime: file.mtime,
              size: file.size,
              url: prefix + name,
            };
          }),
          total: files.length,
        },
      };
    } catch(e) {
      Logger.info(`[API][/paas/api/flow/getAsset]: 出错了: ${e.message}`)
      return {
        code: -1,
        msg: e.message || '出错了'
      }
    }
  }

  @Post('/deleteAsset')
  async deleteAsset(@Body() body) {
    const { path: filePath = './', name } = body;
    const rootFile = path.join(env.FILE_LOCAL_STORAGE_FOLDER, filePath);

    if (!rootFile.startsWith(env.FILE_LOCAL_STORAGE_FOLDER)) {
      return { code: -1, msg: '无法访问非静态文件目录' };
    }

    try {
      if (!fs.existsSync(path.join(rootFile, name))) {
        return { code: -1, msg: '该目录下文件不存在' };
      }

      removeFile(path.join(rootFile, name));

      return { code: 1, msg: '删除成功' };
    } catch(e) {
      console.log(e);
      return { code: -1, msg: '删除失败，请重试' };
    }
  }
}
