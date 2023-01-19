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

  @Post('/saveFiles')
  @UseInterceptors(FileInterceptor('files[]'))
  async uploadFilesToCDN(@Request() request, @Body() body, @UploadedFile() file) {
    try {
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
            return `${request.protocol}:\/\/${request.headers.host}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`
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
