import * as moment from "dayjs";
import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import { genMainIndexOfDB } from '../utils';

export class FileTaskLogDO {
  @Column
  id;

  @Column
  content;

  @Column("file_taskid")
  fileTaskId;

  _createTime;

  @Column("create_time")
  set createTime(createTime) {
    this._createTime = new Date(createTime).getTime();
  }

  get createTime() {
    return moment(this._createTime).format("YYYY-MM-DD HH:mm:ss");
  }

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
  public async createFileTask(query: {
    content: string;
    fileTaskId: number;
  }): Promise<{ id: number | null }> {
    console.log("!!", query);
    const result = await this.exe<any>("fileTaskLog:create", {
      ...query,
      id: genMainIndexOfDB(),
      createTime: new Date().getTime(),
    });

    return {
      id: result && result.insertId ? result.insertId : null,
    };
  }

  @Mapping(FileTaskLogDO)
  public async queryByFileTaskId(fileTaskId: number): Promise<FileTaskLogDO[]> {
    const logs = await this.exe<FileTaskLogDO[]>(
      "fileTaskLog:queryByFileTaskId",
      {
        fileTaskId,
      }
    );
    return logs || [];
  }

  @Mapping(FileTaskLogDO)
  public async queryByFileTaskIdOfPage(query: {
    fileTaskIds: number[];
    limit: number;
    offset: number;
  }): Promise<FileTaskLogDO[]> {
    const logs = await this.exe<FileTaskLogDO[]>(
      "fileTaskLog:queryByFileTaskIdOfPage",
      {
        fileTaskIds: query.fileTaskIds,
        limit: query.limit,
        offset: query.offset,
      }
    );
    return logs || [];
  }

  public async queryTotalCountOfFileTaskIds(query: {
    fileTaskIds: number[];
  }): Promise<{ count: number[] }> {
    const rtn = await this.exe<{ count: number[] }>(
      "fileTaskLog:queryTotalCountOfFileTaskIds",
      {
        fileTaskIds: query.fileTaskIds,
      }
    );
    return rtn && rtn?.[0]?.count;
  }
}
