import {Body, Controller, Get, Inject, Post, Query, Request,} from '@nestjs/common';
import DomainService from './domain.service';
import {getRealDomain} from '../../utils/index'
// @ts-ignore
import {createVM} from 'vm-node';
import FileDao from '../../dao/FileDao';
import ServicePubDao from '../../dao/ServicePubDao';
import FilePubDao from "../../dao/filePub.dao";

@Controller('/paas/api/domain')
export default class DomainController {
  domainService: DomainService;
  
  nodeVMIns: any;
  fileDao: FileDao;
	filePubDao: FilePubDao;
  servicePubDao: ServicePubDao

  constructor() {
    this.nodeVMIns = createVM({ openLog: true });
    this.fileDao = new FileDao();
    this.servicePubDao = new ServicePubDao();
    this.filePubDao = new FilePubDao();
    this.domainService = new DomainService();
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

	@Get('/bundle')
	async getToJSON(@Query() query) {
		const { fileId } = query;
		
		if (!fileId) {
			return { code: -1, message: 'fileId 不能为空' };
		}
		
		const [file] = await this.filePubDao.getLatestPubByFileId(fileId);
		
		if (!file) {
			return { code: -1, message: '对应领域模型文件不存在或模型需要发布' };
		}
		
		const toJSON = JSON.parse((file as any).content);
		toJSON.service = toJSON.serviceAry.map(service => {
			const inputSchema = service.inputSchema || { type: 'any' };
			const outputSchema = service.outputSchema || { type: 'any' };
			
			return { id: service.id, title: service.title, inputSchema, outputSchema };
		});
		toJSON.version = file.version;
		toJSON.serviceAry && (delete toJSON.serviceAry);
		
		return { code: 1, data: toJSON };
	}
}
