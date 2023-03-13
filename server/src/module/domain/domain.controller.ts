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
import { getRealDomain } from '../../utils/index'
// @ts-ignore
import { createVM } from 'vm-node';
const path = require('path');
const env = require('../../../env.js')
const fs = require('fs');
import { uuid } from '../../utils/index'
import FileDao from '../../dao/FileDao';
import ServicePubDao from '../../dao/ServicePubDao';

@Controller('/paas/api/domain')
export default class FlowController {
  @Inject()
  domainService: DomainService;
  
  @Inject()
  uploadService: UploadService;
  
  nodeVMIns: any;
  fileDao: FileDao;
  servicePubDao: ServicePubDao

  constructor() {
    this.nodeVMIns = createVM({ openLog: true });
    this.fileDao = new FileDao();
    this.servicePubDao = new ServicePubDao();
  }


  
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

  async _execServicePub(pubInfo, {
    params,
    serviceId,
    fileId
  }) {
    try {
      if(!pubInfo) {
        return {
          code: -1,
          msg: `未找到 ${fileId} 下的服务 ${serviceId}, 请确认！`,
        };
      }
      const codeStr = decodeURIComponent(pubInfo?.content);
      let res = {
        code: 1,
        data: null,
        msg: '',
      };
      try {
        const { success, data, msg } = await this.nodeVMIns.run(codeStr, {
          injectParam: params
        });
        res = {
          code: success ? 1 : -1,
          data,
          msg,
        };
      } catch (e) {
        console.log(`[/system/domain/run]: 出错 ${JSON.stringify(e)}`);
        res.code = -1;
        res.msg = JSON.stringify(e.msg);
      }
      return res;
    } catch (e) {

    }
  }

  // 领域建模运行时
  @Post('/service/run')
  async systemDomainRun(
    // 通用参数（debug模式全量参数）
    @Body('serviceId') serviceId: string,
    @Body('params') params: any,
    @Body('fileId') fileId: number,
    // 发布后运行定位
    @Body('isOnline') isOnline: any,
    @Body('projectId') projectId: number,
  ) {
    if (!serviceId) {
      return {
        code: -1,
        msg: '缺少 serviceId',
      };
    }
    // 线上环境通
    if(isOnline) {
      let readyExePath;
      try {
        const readyExeTemplateFolderPath = projectId ? path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${projectId}/${fileId}`) : path.join(env.FILE_LOCAL_STORAGE_FOLDER, `/project/${fileId}`);
        const readyExeTemplatePath = path.join(readyExeTemplateFolderPath, `${serviceId}.js`)
        readyExePath = path.join(__dirname, `${serviceId}.${uuid(10)}.js`)
        const templateStr = fs.readFileSync(readyExeTemplatePath, 'utf8');
        fs.writeFileSync(readyExePath, `
          ;let PARAMS = ${JSON.stringify(params || {})};
          ;${templateStr}
        `)
        const { run } = require(readyExePath)
        let res = await run()
        if(fs.existsSync(readyExePath)) {
          fs.unlinkSync(readyExePath)
        }
        return {
          code: 1,
          data: res
        }
      } catch (e) {
        if(fs.existsSync(readyExePath)) {
          fs.unlinkSync(readyExePath)
        }
        return {
          code: -1,
          msg: `执行出错了 ${e.message}`
        }
      }
    } else {
      // 根据相对路径，找出真实fileId，然后去通用pub里面查找
      if(!fileId) {
        return {
          code: -1,
          msg: `未找到 ${fileId} 的文件`
        }
      }

      const pubInfo = await this.servicePubDao.getLatestPubByFileIdAndServiceId({
        fileId: +fileId,
        env: 'prod',
        serviceId
      })
      const res = await this._execServicePub(pubInfo, {
        fileId: +fileId,
        serviceId,
        params,
      })
      return res
    }
  }

}
