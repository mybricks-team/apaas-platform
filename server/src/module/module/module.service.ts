import { Injectable } from '@nestjs/common';
import * as axios from "axios";
import ModuleDao from './../../dao/ModuleDao'
import ModulePubDao from './../../dao/ModulePubDao';
import {getRealDomain} from "../../utils";
import DomainService from "../domain/domain.service";
import FlowService from "../flow/flow.service";

@Injectable()
export default class ModuleService {

  private readonly ModuleDao = new ModuleDao();
  private readonly ModulePubDao = new ModulePubDao();
  private readonly domainService = new DomainService();
  private readonly flowService = new FlowService();

  async create(param) {
    const { id } = await this.ModuleDao.create(param)
    return id
  }

  async getModuleById(id: number) {

  }

  async batchCreatePubInfo(param: {
    moduleId: number,
    pubContentList: any[],
    version: string,
    creatorId: string,
    commitInfo: string,
    creatorName: string
  }) {
    const { id } = await this.ModulePubDao.batchCreate(param)
    return id
  }

  async queryByFileId(param: {
    fileId: number,
    pageSize: number,
    pageIndex: number
  }) {
    return await this.ModuleDao.queryByFileId({ fileId: param.fileId, limit: param.pageSize, offset: param.pageSize * param.pageIndex})
  }

  async getLatestPubByFileId(fileId: number) {
    return await this.ModuleDao.getLatestPubByFileId({ fileId })
  }
	
  async getModuleList() {
    return await this.ModuleDao.getModules();
  }
	
  async installModule(params: { id: number; projectId: number; userId: string }, request: Request) {
		const { id, projectId, userId } = params;
    const [module] = await this.ModuleDao.getModules({ id: id });
	
	  if (!module) {
		  return { code: 0, message: '对应模块不存在' };
	  }
		
	  const domainName = getRealDomain(request);
		
		const pubInfo = await this.ModuleDao.getModuleContent({ id: id });
		const staticFile = [];
	  pubInfo.map(async pub => {
			switch (pub.ext_name) {
				case 'domain': {
					const info = JSON.parse(pub.content);
					
					(axios as any).post(`${domainName}/api/domain/publishForDB`, {
						json: { entityAry: info.entityAry },
						fileId: pub.file_id,
						userId,
						projectId
					});
					
					info.serviceAry.forEach(service => {
						service.code = service.code.replace(/--slot-project-id--/g, projectId);
					});
					await this.domainService.batchCreateService({ fileId: pub.file_id, projectId, serviceContentList: info.serviceAry }, { domainName });
					break;
				}
				case 'cdm': { break; }
				case 'html': {
					staticFile.push({ fileId: pub.file_id, fileName: `${pub.file_id}.html`, content: pub.content });
					break;
				}
				case 'mp': { break; }
			}
	  });
	
	  staticFile.length && (await this.flowService.batchCreateProjectFile({ codeStrList: staticFile, projectId }, { domainName }));
	
	  return { code: 1, message: '安装成功' };
  }
}
