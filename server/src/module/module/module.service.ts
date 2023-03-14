import { Injectable } from '@nestjs/common';
import * as axios from "axios";
import ModuleDao from './../../dao/ModuleDao'
import ModulePubDao from './../../dao/ModulePubDao';
import {getNextVersion, getRealDomain} from "../../utils";
import DomainService from "../domain/domain.service";
import FlowService from "../flow/flow.service";

@Injectable()
export default class ModuleService {
  private readonly moduleDao = new ModuleDao();
  private readonly modulePubDao = new ModulePubDao();
  private readonly domainService = new DomainService();
  private readonly flowService = new FlowService();

  async create(param) {
    const { id } = await this.moduleDao.create(param)
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
    const { id } = await this.modulePubDao.batchCreate(param)
    return id
  }

	async queryPubInfo(params: {
    moduleId: number,
    version: string,
		extNameList: string[]
  }) {
    const { id } = await this.modulePubDao.queryPubInfo(params)
    return id
  }

  async queryByFileId(param: {
    fileId: number,
    pageSize: number,
    pageIndex: number
  }) {
    return await this.moduleDao.queryByFileId({ fileId: param.fileId, limit: param.pageSize, offset: param.pageSize * param.pageIndex})
  }

  async getLatestPubByFileId(fileId: number) {
    return await this.moduleDao.getLatestPubByFileId({ fileId })
  }
	
  async getModuleList() {
    return await this.moduleDao.getModules();
  }
	
  async installModule(params: { id: number; projectId: number; userId: string }, request: Request) {
		const { id, projectId, userId } = params;
	  const [module] = await this.moduleDao.getModules({ id: id });
	  const [projectModule] = await this.moduleDao.getProjectModuleInfo(projectId);
	
	  if (!module) {
		  return { code: 0, message: '对应模块不存在' };
	  }
		
	  const domainName = getRealDomain(request);
		
		const pubInfo = await this.moduleDao.getModuleContent({ id: id });
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
					let newContent = pub.content.replace(/--slot-project-id--/, projectId);
					staticFile.push({ fileId: pub.file_id, fileName: `${pub.file_id}.html`, content: newContent });
					break;
				}
				case 'mp': { break; }
			}
	  });
	
	  staticFile.length && (await this.flowService.batchCreateProjectFile({ codeStrList: staticFile, projectId }, { domainName }));
	
		if (projectModule) {
			const moduleList = projectModule.module_info?.moduleList || [];
			const findModule = moduleList.find(m => m.originFileId === module.originFileId);
			
			if (findModule) {
				findModule.version = module.version;
				findModule.id = module.id;
				findModule.name = module.name;
			} else {
				moduleList.push({ id: module.id, name: module.name, version: module.version, originFileId: module.originFileId });
			}
			await this.moduleDao.createProjectModuleInfo({
				file_id: projectId,
				module_info: JSON.stringify({ ...JSON.parse(projectModule.module_info || '{}'), moduleList }),
				create_time: Date.now(),
				creator_name: userId,
				version: projectModule.version ? getNextVersion(projectModule.version) : '1.0.0',
			});
		} else {
			await this.moduleDao.createProjectModuleInfo({
				file_id: projectId,
				module_info: JSON.stringify({ moduleList: [{ id: module.id, name: module.name, version: module.version, originFileId: module.originFileId }] }),
				create_time: Date.now(),
				creator_name: userId,
				version: '1.0.0',
			});
		}
		
	  return { code: 1, message: '安装成功' };
  }
}
