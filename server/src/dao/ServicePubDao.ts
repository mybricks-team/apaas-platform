import { Column, DOBase, Mapping } from '@mybricks/rocker-dao'
import * as moment from 'dayjs'

export class ServicePubDO {
  @Column
  id: number;

  @Column("file_id")
  fileId: number;

  @Column("service_id")
  serviceId: string;

  @Column("name")
  name: string;

  @Column("file_pub_id")
  filePubId: number;

  @Column("project_id")
  projectId: number;

  @Column
  content: string;

  @Column
  env: string;

  @Column
  status: number;

  @Column("creator_id")
  creatorId: number;

  @Column("creator_name")
  creatorName: string;

  @Column("create_time")
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column
  type: string;
}

export default class ServicePubDao extends DOBase {
  public async batchCreate(params: {
    fileId: number;
    serviceContentList: any[];
    env: string;
    creatorId: string;
    creatorName: string;
    filePubId?: number;
    projectId?: number;
    status?: number;
  }): Promise<{ id: number | null }> {

    if (!params.status) {
      params.status = 1
    }

    if (!params.projectId) {
      params.projectId = null
    }

    if (!params.filePubId) {
      params.filePubId = null
    }

    const result = await this.exe<any>('apaas_service_pub:batchCreate', {
      ...params,
      createTime: new Date().getTime()
    })

    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  @Mapping(ServicePubDO)
  public async getLatestPubByFileId(params: {
    fileId: number;
    env: string;
  }) {
    const result = await this.exe<any>('apaas_service_pub:getLatestPubByFileId', params)

    return result && result[0]
  }

  @Mapping(ServicePubDO)
  public async getLatestPubByProjectIdAndFileId(params: {
    projectId: number;
    fileId: number;
    env: string;
  }) {
    const result = await this.exe<any>('apaas_service_pub:getLatestPubByProjectIdAndFileId', params)

    return result && result[0]
  }

}