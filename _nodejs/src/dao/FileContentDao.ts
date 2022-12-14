import * as moment from 'dayjs';
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao';

export class FileContentDO {
  @Column
  id: number;

  @Column('file_id')
  fileId: number;
	
	@Column('version')
  version : number;

  @Column('creator_id')
  creatorId: string;

  @Column('creator_name')
  creatorName: string;

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('update_time')
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('content')
  content: string;
}

export default class FileContentDao extends DOBase {
  @Mapping(FileContentDO)
  public async queryBy<T>(params: {
    fileId?: number;
    ids?: number[];
    fileIds?: number[];
    orderBy?: string;
	  sortType?: 'desc' | 'asc';
    offset?: number;
    limit?: number;
  }): Promise<T> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:queryByFilters',
      params
    )

    if (Array.isArray(fileContents)) {
      if (fileContents.length > 0) {
        // @ts-ignore
        return fileContents.length == 1 ? fileContents[0] : fileContents
      } else {
        return
      }
    } else {
      return fileContents
    }
  }

  @Mapping(FileContentDO)
  public async queryById(params: {
    id: number
  }): Promise<FileContentDO[]> {
    const fileContents = await this.exe<FileContentDO[]>(
      'apaas_file_content:queryById',
      params
    ) as any

    return fileContents;
  }

  @Mapping(FileContentDO)
  public async getContentVersions(params: {
    fileId: number;
	  limit: number;
	  offset: number;
  }): Promise<FileContentDO[]> {
	  return await this.exe<FileContentDO[]>('apaas_file_content:getContentVersions', params) as any;
  }

  public async create(params: {
    fileId: number
    creatorId: string
    version: string
    creatorName: string
    content: string
  }): Promise<{ id: number }> {
    const result = await this.exe<any>(
      'apaas_file_content:insert',
      Object.assign(
        params,
        {
          createTime: new Date().getTime(),
          updateTime: new Date().getTime(),
        }
      )
    );

    return {id: result.insertId}
  }

  public async update(params: {
    id: number
    fileId?: number
    creatorId?: string
    creatorName?: string
    content?: string
  }): Promise<{ id: number }> {
    await this.exe<any>(
      'apaas_file_content:update',
      Object.assign(
        params,
        {
          updateTime: new Date().getTime()
        }
      )
    );

    // return result;
    return {id: params.id};
  }


  public async updateContent(params: {
    id: number,
    content: string
  }): Promise<{ id: number }> {
    await this.exe<any>(
      'apaas_file_content:updateContent',
      Object.assign(
        params,
        {
          updateTime: new Date().getTime()
        }
      )
    );

    // return result;
    return {id: params.id}
  }
}
