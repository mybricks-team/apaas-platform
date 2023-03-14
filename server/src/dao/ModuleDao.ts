import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import * as moment from "dayjs";

export class ModuleDO {
  @Column
  id: number;

  @Column("name")
  name: string;

  @Column("description")
  description: string;

  @Column("origin_file_id")
  originFileId: number;

  @Column("version")
  version: string;

  @Column("status")
  status: number;

  @Column("creator_id")
  creatorId: string;

  @Column("creator_name")
  creatorName: string;

  @Column("create_time")
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }
}

export default class ModuleDao extends DOBase {
  // @Mapping(ConfigDO)
  // public async getConfig(params: { namespace: string[] }) {
  //   return await this.exe<ConfigDO[]>("apaas_config:getConfigByNamespace", {
  //     ...params,
  //   });
  // }

  @Mapping(ModuleDO)
  async getLatestPubByFileId(params: { fileId: number }) {
    return await this.exe<ModuleDO[]>('apaas_module_info:getLatestPubByFileId', {
      ...params,
    })
  }

  @Mapping(ModuleDO)
  public async queryByFileId(params: {
    fileId: number;
    limit?: number;
    offset?: number;
  }) {
    params = Object.assign({}, params)

    if (!params.limit) {
      params.limit = 1
    } else {
      params.limit = Number(params.limit)
    }
    if (!params.offset) {
      params.offset = 0
    } else {
      params.offset = Number(params.offset)
    }
    return await this.exe<ModuleDO[]>(
      'apaas_module_info:queryByFileId',
      params
    )
  }

  @Mapping(ModuleDO)
  async getModules(params?: { id?: number }) {
    return await this.exe<ModuleDO[]>('apaas_module_info:getModules', params ?? {});
  }

  async create(params: {
    id: number;
    name: string;
    description: string
    originFileId: number
    version: string
    creatorId: string
    creatorName: string
  }) {
    const result = await this.exe<{ insertId: number }>("apaas_module_info:create", {
      ...params,
      createTime: Date.now(),
    });
    return { id: result.insertId };
  }
	
	async getProjectModuleInfo(projectId: number) {
		return await this.exe<any[]>('apaas_module_info:getProjectModuleInfo', { projectId });
	}
	
	async createProjectModuleInfo(params: { file_id: number; version: string; module_info: string; creator_name: string; create_time: number }) {
		return await this.exe('apaas_module_info:createProjectModuleInfo', params);
	}

  // async update(params: {
  //   updatorId: string;
  //   updatorName: string;
  //   config: string;
  //   namespace: string;
  // }) {
  //   await this.exe<{ insertId: number }>("apaas_config:update", {
  //     ...params,
  //     updateTime: new Date().getTime(),
  //   });
  // }
}
