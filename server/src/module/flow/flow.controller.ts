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
import FlowService from './flow.service';
import { FileInterceptor } from '@nestjs/platform-express';
const env = require('../../../env.js')

@Controller('/paas/api/flow')
export default class FlowController {
  @Inject()
  flowService: FlowService;

  @Get('/test')
  async test() {
    return {
      code: 1
    }
  }

  @Post('/saveFile')
  @UseInterceptors(FileInterceptor('file'))
  async saveFile(@Request() request, @Body() body, @UploadedFile() file) {
    console.log('saveFile请求头是', request.headers)
    let hostName = request.headers.host
    if(request.headers['x-forwarded-host']) {
      hostName = request.headers['x-forwarded-host']
    } else if(request.headers['x-host']) {
      hostName = request.headers['x-host'].replace(':443', '')
    }
    try {
      const subPath = await this.flowService.saveFile({
        str: file.buffer,
        filename: file.originalname,
        folderPath: body.folderPath
      });
      return {
        data: {
          url: `${request.protocol}:\/\/${hostName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`,
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
    console.log('saveFiles请求头是', request.headers)
    try {
      let hostName = request.headers.host
      if(request.headers['x-forwarded-host']) {
        hostName = request.headers['x-forwarded-host']
      } else if(request.headers['x-host']) {
        hostName = request.headers['x-host'].replace(':443', '')
      }
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
            return `${request.protocol}:\/\/${hostName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`
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
