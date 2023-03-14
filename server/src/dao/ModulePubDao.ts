import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import * as moment from "dayjs";

export class ModulePubDO {
  @Column
  id: number;

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

export default class ModulePubDao extends DOBase {
  async batchCreate(params: {
    moduleId: number,
    pubContentList: any[],
    version: string,
    creatorId: string,
    creatorName: string
  }) {
    const result = await this.exe<{ id }>('apaas_module_pub_info:batchCreate', {
      ...params,
      createTime: new Date().getTime()
    })
    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  async queryPubInfo(params: {
    moduleId: number,
    extNameList: string[],
    version: string
  }) {
    const result = await this.exe('apaas_module_pub_info:queryPubInfo', {
      ...params,
      status: 1
    })
    return result
  }

  async getModulePubContent(params: { id: number }) {
    return await this.exe<any[]>('apaas_module_pub_info:getModulePubContent', params);
  }
  
}
