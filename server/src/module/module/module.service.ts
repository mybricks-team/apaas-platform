import { Injectable } from '@nestjs/common';
import ModuleDao from './../../dao/ModuleDao'
import ModulePubDao from './../../dao/ModulePubDao';

@Injectable()
export default class ModuleService {

  private readonly ModuleDao = new ModuleDao();
  private readonly ModulePubDao = new ModulePubDao();

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
	
  async installModule(params: { id: number; projectId: number }) {
    const [module] = await this.ModuleDao.getModules({ id: params.id });
		
		const pubInfo = await this.ModuleDao.getModuleContent({ id: params.id });
	  pubInfo.map(pub => {
			switch (pub.ext_name) {
				case 'domain': {
					const info = JSON.parse(pub.content);
					// info.entityAry
					break;
				}
				case 'cdm': { break; }
				case 'html': { break; }
				case 'mp': { break; }
			}
	  });
		
		if (!module) {
			return { code: 0, message: '对应模块不存在' };
		}
  }
}
