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
import DomainService from './domain.service';
import UploadService from '../upload/upload.service';
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');
import { uuid } from '../../utils/index'
const { getConnection } = require("@mybricks/rocker-dao");
const { SnowFlake } = require('gen-uniqueid');

@Controller('/runtime/api/domain')
export default class FlowController {
  @Inject()
  domainService: DomainService;
  
  @Inject()
  uploadService: UploadService;
  
  // runtime env
  snowFlake: any
  
  constructor() {
    this.snowFlake = new SnowFlake({ workerId: process.env.WorkerId == undefined ? 1 : process.env.WorkerId });
  }

  // 领域建模运行时(运行时)
  @Post('/service/run')
  async systemDomainRun(
    @Body('serviceId') serviceId: string,
    @Body('params') params: any,
    @Body('fileId') fileId: number,
    @Body('projectId') projectId: number
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    let readyExePath;
    try {
      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      const { startExe } = require(readyExePath)
      let res = await startExe(params || {}, {
        dbConnection: await getConnection(),
        snowFlake: this.snowFlake
      })
      return {
        code: 1,
        data: res
      }
    } catch (e) {
      return {
        code: -1,
        msg: `${typeof e === 'string' ? e : e.message}`
      }
    }
  }

}
