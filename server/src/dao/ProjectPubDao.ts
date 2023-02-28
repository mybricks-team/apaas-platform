import { Column, DOBase, Mapping } from '@mybricks/rocker-dao'
import * as moment from 'dayjs'

export class ProjectPubDO {
  @Column
  id: number;

  @Column("project_id")
  projectId: number;

  @Column("file_id")
  fileId: number;

  @Column("file_content_id")
  fileContentId: number;

  @Column
  version: string;

  @Column
  content: string;

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

export default class ProjectPubDao extends DOBase {
  public async create(params: {
    projectId: number;
    fileId: number;
    fileContentId?: number;
    version?: string;
    content: string;
    creatorId: string;
    creatorName: string;
    type: string;
  }): Promise<{ id: number | null }> {

    if (!params.fileContentId) {
      params.fileContentId = null
    }

    if (!params.version) {
      params.version = null
    }

    const result = await this.exe<any>('apaas_project_pub:create', {
      ...params,
      status: 1,
      createTime: new Date().getTime()
    })

    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  @Mapping(ProjectPubDO)
  public async getLatestPubByProjectIdAndFileId(params: {
    projectId: number;
    fileId: number;
    type: string;
  }) {
    const result = await this.exe<any>('apaas_project_pub:getLatestPubByProjectIdAndFileId', params)

    return result && result[0]
  }

}
