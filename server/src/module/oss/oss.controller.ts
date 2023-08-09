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
const env = require('../../../env.js');
import { getRealDomain } from '../../utils/index';
import FlowService from './../flow/flow.service';
import OssService from './oss.service';
import { uuid } from '../../utils/index';
import * as path from 'path';

@Controller('/paas/api/oss')
export default class OssController {
  flowService: FlowService;
  ossService: OssService;

  constructor() {
    this.ossService = new OssService();
    this.flowService = new FlowService();
  }

  @Post('/uploadFile')
  @UseInterceptors(FileInterceptor('file'))
  async saveFile(@Request() request, @Body() body, @UploadedFile() file) {
    const ossConfig = await this.ossService.getOssConfig();

    if (ossConfig?.openOss) {
      try {
        const { url } = await this.ossService.saveFile({
          buffer: file.buffer,
          name: `${uuid()}-${new Date().getTime()}${path.extname(
            file.originalname,
          )}`,
          path: body.folderPath,
        }, ossConfig);
        return {
          data: {
            url,
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

    const domainName = getRealDomain(request);
    try {
      const subPath = await this.flowService.saveFile({
        str: file.buffer,
        // filename: file.originalname,
        filename: `${uuid()}-${new Date().getTime()}${path.extname(
          file.originalname,
        )}`,
        folderPath: body.folderPath,
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
}
