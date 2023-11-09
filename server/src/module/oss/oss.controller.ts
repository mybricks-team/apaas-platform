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
import { } from 'querystring'
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
  async saveFile(@Body() body, @Request() request, @UploadedFile() uploadFile) {
    const ossConfig = await this.ossService.getOssConfig();
    const file = uploadFile || body.file;
    const { openOss, cdnDomain, ...configItem } = ossConfig || {}

    if (openOss) {
      try {
        let { url } = await this.ossService.saveFile({
          buffer: file.buffer,
          name: `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
          path: body.folderPath,
        }, configItem);

        if (cdnDomain) { // 替换正则
          const domainReg = /^(https?:\/\/)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/; 
          url = url.replace(domainReg, cdnDomain)
        }
        return { data: { url }, code: 1 };
      } catch (err) {
        return { code: -1, msg: `上传失败: ${err}`, message: `上传失败: ${err}` };
      }
    }

    const domainName = getRealDomain(request);
    try {
      const subPath = await this.flowService.saveFile({
        str: file.buffer,
        filename: `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
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
