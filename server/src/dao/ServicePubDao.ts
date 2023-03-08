import { Column, DOBase, Mapping } from '@mybricks/rocker-dao'
import * as moment from 'dayjs'

export class ServicePubDO {
  @Column
  id: number;

  @Column("file_id")
  fileId: number;

  @Column("service_id")
  serviceId: number;

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
  public async create(params: {
    fileId: number;
    serviceId: string;
    filePubId?: number;
    projectId?: number;
    content?: string;
    env: string;
    status: number;
    creatorId: string;
    creatorName: string;
    type: string;
  }): Promise<{ id: number | null }> {

    if (!params.status) {
      params.status = 1
    }

    const result = await this.exe<any>('apaas_service_pub:create', {
      ...params,
      createTime: new Date().getTime()
    })

    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  @Mapping(ServicePubDO)
  public async getLatestPubByProjectIdAndFileId(params: {
    projectId: number;
    fileId: number;
    type: string;
  }) {
    const result = await this.exe<any>('apaas_service_pub:getLatestPubByProjectIdAndFileId', params)

    return result && result[0]
  }

}