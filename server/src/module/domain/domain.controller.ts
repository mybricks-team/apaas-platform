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
import { getRealDomain } from '../../utils/index'
// @ts-ignore
import { createVM } from 'vm-node';
// const path = require('path');
// const env = require('../../../env.js')
// const fs = require('fs');
// import { uuid } from '../../utils/index'
import FileDao from '../../dao/FileDao';
import ServicePubDao from '../../dao/ServicePubDao';

@Controller('/paas/api/domain')
export default class FlowController {
  @Inject()
  domainService: DomainService;
  
  nodeVMIns: any;
  fileDao: FileDao;
  servicePubDao: ServicePubDao

  constructor() {
    this.nodeVMIns = createVM({ openLog: true });
    this.fileDao = new FileDao();
    this.servicePubDao = new ServicePubDao();
  }

  
  // 模块安装时，发布到运行容器
  @Post('/service/batchCreate')
  async batchCreateService(
    @Body('fileId') fileId: number,
    @Body('projectId') projectId: number,
    @Body('serviceContentList') serviceContentList: {id: string, code: string}[],
    @Request() request,
  ) {
    const domainName = getRealDomain(request)
    if(!fileId || !serviceContentList) {
      return {
        code: -1,
        msg: 'fileId 或 serviceContent 为空'
      }
    }
    try {
      const cdnList = await this.domainService.batchCreateService({
        fileId,
        projectId,
        serviceContentList
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

}
