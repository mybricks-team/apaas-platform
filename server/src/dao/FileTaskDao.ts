import * as moment from "dayjs";
import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";

export class FileTaskDO {
  @Column
  id;

  @Column
  name;

  @Column("file_id")
  fileId;

  @Column
  type;

  @Column("meta_info")
  metaInfo;

  @Column
  content;

  @Column("running_status")
  runningStatus;

  @Column("creator_id")
  creatorId;

  @Column("creator_name")
  creatorName;

  @Column("updator_id")
  updatorId;

  @Column("updator_name")
  updatorName;

  _createTime;

  @Column("create_time")
  set createTime(createTime) {
    this._createTime = new Date(createTime).getTime();
  }

  get createTime() {
    return moment(this._createTime).format("YYYY-MM-DD HH:mm:ss");
  }

  _updateTime;

  @Column("update_time")
  set updateTime(updateTime) {
    this._updateTime = new Date(updateTime).getTime();
  }

  get updateTime() {
    return moment(this._updateTime).format("YYYY-MM-DD HH:mm:ss");
  }

  @Column("ext_name")
  public extName;

  @Column
  public status;

  toJSON() {
    const json = {};
    Object.getOwnPropertyNames(this).forEach((nm) => {
      json[nm] = this[nm];
    });

    const thProto = Object.getPrototypeOf(this);
    Object.getOwnPropertyNames(thProto).forEach((nm) => {
      const pd = Object.getOwnPropertyDescriptor(thProto, nm);
      if (pd.get) {
        json[nm] = this[nm];
      }
    });

    return json;
  }
}

export default class FileTaskDao extends DOBase {
  @Mapping(FileTaskDO)
  public async query(
    query?: {
      id?: number;
      name?: string;
      type?: string;
      creatorId?: string;
      fileId?: number;
      page?: number;
      pageSize?: number;
    },
    isAdministrator?: number
  ): Promise<Array<FileTaskDO>> {
    query = Object.assign({}, query);

    const limit = query.pageSize || 100;
    const offset = limit * (query.page || 0) || 0;

    if (query.name) {
      query.name = `%${query.name}%`;
    }

    if (typeof query.fileId === "undefined") {
      query.fileId = null;
    }

    return await this.exe<Array<FileTaskDO>>("fileTask:queryAll", {
      ...query,
      isAdministrator,
      limit,
      offset,
    });
  }

  @Mapping(FileTaskDO)
  public async queryById(id: number): Promise<FileTaskDO> {
    const files = await this.exe<FileTaskDO[]>("fileTask:queryById", {
      id,
    });
    return files && files.length > 0 ? files[0] : void 0;
  }

  @Mapping(FileTaskDO)
  public async queryRunningTaskByFileId(fileId: number): Promise<FileTaskDO[]> {
    const files = await this.exe<FileTaskDO[]>(
      "fileTask:queryRunningTaskByFileId",
      {
        fileId,
      }
    );
    return files || [];
  }

  @Mapping(FileTaskDO)
  public async queryContentById(id: number): Promise<FileTaskDO> {
    const files = await this.exe<FileTaskDO[]>("fileTask:queryContentById", {
      id,
    });

    return files && files.length > 0 ? files[0] : void 0;
  }

  public async createFileTask(query: {
    name: string;
    content: string;
    metaInfo: string;
    creatorId: string;
    creatorName: string;
    type: string;
    fileId: number;
    runningStatus?: number;
  }): Promise<{ id: number | null }> {
    const result = await this.exe<any>("fileTask:create", {
      ...query,
      runningStatus: query?.runningStatus || -1,
      status: 1,
      createTime: new Date().getTime(),
      updateTime: new Date().getTime(),
    });

    return {
      id: result && result.insertId ? result.insertId : null,
    };
  }

  public async deleteFileTask(query: {
    id?: number;
    updatorId: string;
    updatorName: string;
  }): Promise<{ id: number | null }> {
    query = Object.assign(query, {
      updateTime: new Date().getTime(),
    });
    const result = await this.exe<any>("fileTask:delete", query);

    return {
      id: !!result ? query.id : null,
    };
  }

  public async update(query: {
    id: number;
    updatorId?: string;
    updatorName?: string;
    name?: string;
    shareType?: number;
    runningStatus?: number;
    version?: string;
    description?: string;
    icon?: string;
  }) {
    query = Object.assign(query, {
      updateTime: new Date().getTime(),
    });

    if (typeof query.icon !== "string") {
      query.icon = null;
    }

    const result = await this.exe<any>("fileTask:update", query);
    return { id: result.insertId };
  }
}
