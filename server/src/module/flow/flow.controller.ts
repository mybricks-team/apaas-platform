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
import UploadService from '../upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
const env = require('../../../env.js')
import { getRealDomain } from '../../utils/index'

@Controller('/paas/api/flow')
export default class FlowController {
  @Inject()
  uploadService: UploadService;

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

  @Post('/saveFile')
  @UseInterceptors(FileInterceptor('file'))
  async saveFile(@Request() request, @Body() body, @UploadedFile() file) {
    const domainName = getRealDomain(request)
    console.log('saveFile请求头是', `${domainName}`,)
    try {
      const subPath = await this.uploadService.saveFile({
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
          return this.uploadService.saveFile({
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
