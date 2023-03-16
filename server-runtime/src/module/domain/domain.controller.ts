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
// @ts-ignore
import { createVM } from 'vm-node';
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');
import { uuid } from '../../utils/index'
import FileDao from '../../dao/FileDao';
import ServicePubDao from '../../dao/ServicePubDao';
const { getConnection } = require("@mybricks/rocker-dao");
const { SnowFlake } = require('gen-uniqueid');

@Controller('/runtime/api/domain')
export default class FlowController {
  @Inject()
  domainService: DomainService;
  
  @Inject()
  uploadService: UploadService;
  
  nodeVMIns: any;
  fileDao: FileDao;
  servicePubDao: ServicePubDao
  // runtime env
  runtimeDBConnection: any
  snowFlake: any
  
  constructor() {
    this.nodeVMIns = createVM({ openLog: true });
    this.fileDao = new FileDao();
    this.servicePubDao = new ServicePubDao();
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
      if(!this.runtimeDBConnection) {
        this.runtimeDBConnection = await getConnection();
      }
      const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
      readyExePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`);
      const { startExe } = require(readyExePath)
      let res = await startExe(params || {}, {
        dbConnection: this.runtimeDBConnection,
        snowFlake: this.snowFlake
      })
      return {
        code: 1,
        data: res
      }
    } catch (e) {
      return {
        code: -1,
        msg: `执行出错了 ${e.message}`
      }
    }
  }

}
