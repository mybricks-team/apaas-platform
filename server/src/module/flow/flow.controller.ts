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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
const env = require('../../../env.js')
import { getRealDomain } from '../../utils/index'
import FlowService from './flow.service';

@Controller('/paas/api/flow')
export default class FlowController {
  @Inject()
  flowService: FlowService;

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

  @Post('/test2')
  @UseInterceptors(FileInterceptor('file'))
  async test2(@Request() request, @Body() body, @UploadedFile() file) {
    const domainName = getRealDomain(request)
    console.log('----')
    console.log(request.headers)
    console.log(domainName)
    return {
      code: 1
    }
  }

  // 模块安装时，发布到运行容器
  @Post('/file/batchCreate')
  async batchCreateProjectFile(
    @Body('projectId') projectId: number,
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
    const domainName = getRealDomain(request)
    console.log('saveFile请求头是', `${domainName}`,)
    try {
      const subPath = await this.flowService.saveFile({
        str: file.buffer,
        filename: file.originalname,
        folderPath: body.folderPath
      });
      return {
        data: {
          url: `${domainName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`,
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
  @UseInterceptors(FileInterceptor('files[]'))
  async saveFiles(@Request() request, @Body() body, @UploadedFile() file) {
    try {
      const domainName = getRealDomain(request)
      console.log('saveFile请求头是', `${domainName}`,)
      let files = file || [];
      if (!Array.isArray(files)) {
        files = [files];
      }
      const cdnList = await Promise.all(
        files.map((file) => {
          return this.flowService.saveFile({
            str: file.buffer,
            filename: file.originalname,
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
}
