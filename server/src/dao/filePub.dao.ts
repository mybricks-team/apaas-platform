import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import { EffectStatus } from "../constants";
import * as moment from "dayjs";

export class FilePublishDO {
  @Column
  id: number;

  @Column("file_id")
  fileId: number;

  @Column("version")
  version: number;

  @Column("creator_id")
  creatorId: string;

  @Column("creator_name")
  creatorName: string;

  @Column("commit_info")
  commitInfo: string;

  @Column("file_content_id")
  fileContentId: number;

  @Column("type")
  type: string;

  @Column("project_id")
  projectId: string;

  @Column("create_time")
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column("update_time")
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column("content")
  content: string;
}

export default class FilePubDao extends DOBase {
  async create(query: {
    version: string;
    fileId: number;
    creatorId: string;
    creatorName: string;
    content: string;
    type: string;
    status?: EffectStatus;
    commitInfo?: string;
    fileContentId?: number;
    projectId?: number
  }): Promise<{ id: number | null }> {
    if (!query.type) {
      query.type = "";
    }

    const result = await this.exe<any>("apaas_file_pub:create", {
      ...query,
      status: query.status ?? EffectStatus.EFFECT,
      createTime: Date.now(),
      commitInfo: query.commitInfo ?? "",
      fileContentId: query.fileContentId ?? null,
      projectId: query?.projectId ?? null
    });

    return {
      id: result && result.insertId ? result.insertId : null,
    };
  }

  async update(
    query: { fileId?: number; id?: number; version?: string },
    nextInfo: {
      content?: string;
      commitInfo?: string;
      fileContentId?: string;
      status?: EffectStatus;
    }
  ) {
    if (query.id || (query.fileId && query.version)) {
      await this.exe<any>("apaas_file_pub:update", {
        query,
        nextInfo: {
          ...nextInfo,
          updateTime: Date.now(),
          content: nextInfo.content ?? null,
          status:
            nextInfo.status === undefined || nextInfo.status === null
              ? undefined
              : String(nextInfo.status),
        },
      });
    }
  }

  @Mapping(FilePublishDO)
  async getLatestPubByFileId(fileId: number, type?: string) {
    // 备注：查询会过滤项目空间下的发布
    return await this.exe<{ id: number; file_id: number; version: string }[]>(
      "apaas_file_pub:getLatestPubByFileId",
      { fileId, type }
    );
  }

  @Mapping(FilePublishDO)
  async getLatestPubByFileIdAndProjectId({fileId, type, projectId}) {
    return await this.exe<{ id: number; file_id: number; version: string }[]>(
      "apaas_file_pub:getLatestPubByFileIdAndProjectId",
      { fileId, type, projectId }
    );
  }

  @Mapping(FilePublishDO)
  async getContentVersions(params: {
    fileId: number;
    limit: number;
    offset: number;
    type: string;
  }) {
    return await this.exe<FilePublishDO[]>(
      "apaas_file_pub:getContentVersions",
      params
    );
  }

  @Mapping(FilePublishDO)
  async getPublishByFileId(id: number) {
    return await this.exe<FilePublishDO[]>("apaas_file_pub:getPublishByFileId", {
      id,
    });
  }

  @Mapping(FilePublishDO)
  async getPublishByFileIdAndVersion(params: {
    fileId: string;
    version: string;
  }) {
    const res = await this.exe<FilePublishDO[]>(
      "apaas_file_pub:getPublishByFileIdAndVersion",
      {
        ...params,
      }
    );
    return res ? res[0] : null;
  }

  @Mapping(FilePublishDO)
  async getLatestPubByIds(params: {
    ids: number[], envType: string
  }) {
    let envType = 'prod'
    if(params.envType) {
      envType = params.envType
    }
    return await this.exe<any>(
      "apaas_file_pub:getLatestPubByIds",
      { ids: params.ids, envType }
    );
  }

}
