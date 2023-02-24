import * as moment from "dayjs";
import {Column, DOBase, Mapping} from "@mybricks/rocker-dao";
import {EffectStatus} from "../constants";

export const FileTypeEnum = {
  SYSTEM: 'system',
  USER: 'user'
}

export class FileDO {
  @Column
  id;

  @Column("group_id")
  groupId;

  @Column("parent_id")
  parentId;

  @Column("has_icon")
  hasIcon;
  
  @Column
  path;

  @Column
  name;

  @Column
  icon;

  @Column
  description;

  @Column
  version;

  @Column("updator_id")
  updatorId;

  @Column("updator_name")
  updatorName;

  @Column("creator_id")
  creatorId;

  @Column("creator_name")
  creatorName;

  _createTime;

  @Column("create_time")
  set createTime(createTime) {
    this._createTime = new Date(createTime).getTime();
  }

  get createTime() {
    return moment(this._createTime).format("YYYY-MM-DD HH:mm:ss")
  }

  _updateTime;

  @Column("update_time")
  set updateTime(updateTime) {
    this._updateTime = new Date(updateTime).getTime();
  }

  get updateTime() {
    return moment(this._updateTime).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column("ext_name")
  public extName;

  // 文件类型：系统文件、用户文件
  @Column("type")
  public type;

  @Column
  public status;

  @Column
  public namespace;

  @Column("share_type")
  shareType;

  toJSON() {
    const json = {}
    Object.getOwnPropertyNames(this).forEach(nm => {
      json[nm] = this[nm]
    })

    const thProto = Object.getPrototypeOf(this)
    Object.getOwnPropertyNames(thProto).forEach(nm => {
      const pd = Object.getOwnPropertyDescriptor(thProto, nm)
      if (pd.get) {
        json[nm] = this[nm]
      }
    })

    return json
  }
}

export default class FileDao extends DOBase {

  @Mapping(FileDO)
  public async pureQuery(query?: {
    id?: number
    extName?: string
  }): Promise<Array<FileDO>> {
    query = Object.assign({}, query)

    return await this.exe<Array<FileDO>>("apaas_file:query", {
      ...query
    });
  }

  @Mapping(FileDO)
  public async query(query?: {
    id?: number
    name?: string
    groupId?: number
    groupIds?: string | string[]
    namespaces?: string[];
    extName?: string
    extNames?: string[]
    page?: number
    pageSize?: number
    creatorId?: string
    parentId?: number
    shareType?: number
  }, isAdministrator?: number): Promise<Array<FileDO>> {
    query = Object.assign({}, query)

    const limit = query.pageSize || 100
    const offset = (limit * (query.page || 0)) || 0
    // 兼容文件夹过滤情况
    let folderExtName = '_pc'
    if (query.extName) {
      folderExtName = query.extName.split('_')[0] + folderExtName
      query.extName += '%'
    }
    if (query.name) {
      query.name = `%${query.name}%`
    }

    if (typeof query.parentId === 'undefined') {
      query.parentId = null
    }

    if (typeof query.groupIds === 'undefined') {
      query.groupIds = null
    }

    if (typeof query.shareType === 'undefined') {
      query.shareType = null
    }

    if (typeof query.groupId === 'undefined') {
      query.groupId = null
    }

    return await this.exe<Array<FileDO>>("apaas_file:queryAll", {
      ...query,
      isAdministrator,
      folderExtName,
      limit,
      offset
    });
  }

  @Mapping(FileDO)
  public async queryAllFilesByParentId(query?: {
    parentId: number
  }): Promise<Array<FileDO>> {
    if(!query.parentId) {
      return Promise.reject('缺少parentId')
    }
    query = Object.assign({}, query)

    return await this.exe<Array<FileDO>>("apaas_file:queryAllFilesByParentId", {
      ...query
    });
  }

  /**
   * 获取文件信息
   * @param id
   * @param status
   */
  @Mapping(FileDO)
  public async queryById(id: number, status = [EffectStatus.EFFECT]): Promise<FileDO> {
    const files = await this.exe<FileDO[]>("apaas_file:queryById", {
      id,
	    status
    })

    return files && files.length > 0 ? files[0] : void 0
  }

  /**
   * 获取文件信息
   * @param id
   */
  @Mapping(FileDO)
  public async queryByRef(ref: string): Promise<FileDO[]> {
    const files = await this.exe<FileDO[]>("apaas_file:queryByRef", {
      ref
    })

    return files
  }

  @Mapping(FileDO)
  public async queryByNamespace(namespace: string): Promise<FileDO> {
    const files = await this.exe<FileDO[]>("apaas_file:queryByNamespace", {
      namespace
    })

    return files && files.length > 0 ? files[0] : void 0
  }


  public async createFile(query: {
    name: string,
    creatorId: string,
    creatorName: string,
    extName: string,
    groupId?: number,
    description?: string,
    parentId?: number,
    namespace?: string,
    icon?: string,
    type?: string,
    version?: string
  }): Promise<{ id: number | null }> {
    if (!query.version) {
      query.version = '1.0.0'
    }
    if (!query.parentId) {
      query.parentId = null
    }
    if (!query.description) {
      query.description = null
    }

    const result = await this.exe<any>('apaas_file:create', {
      ...query,
      namespace: query.namespace || '_self',
      type: query.type || FileTypeEnum.USER,
      groupId: query.groupId ?? null,
      icon: query.icon || '',
      create_time: new Date().getTime(),
      update_time: new Date().getTime()
    })

    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  /** 批量创建文件 */
  public async batchCreateFile(files: Array<{
    name: string,
    creatorId: string,
    creatorName: string,
    extName: string,
    groupId?: number,
    description?: string,
    parentId?: number,
    namespace?: string,
    icon?: string,
    type?: string,
    version?: string
  }>): Promise<{ id: number | null }> {
    const result = await this.exe<any>("apaas_file:batchCreate", {
      files: files.map(file => {
        return {
          ...file,
          version: file.version || '1.0.0',
          parentId: file.parentId || null,
          groupId: file.groupId ?? null,
          description: file.description || null,
          namespace: file.namespace || '_self',
          type: file.type || '',
          icon: file.icon || '',
          create_time: Date.now(),
          update_time: Date.now()
        }
      }),
    })

    return {
      id: result && result.insertId ? result.insertId : null
    }
  }

  /**
   * 删除File
   * @description 逻辑删除
   * @param id
   */
  public async deleteFile(query: {
    id?: number
    updatorId: string
    updatorName: string
  }): Promise<{ id: number | null }> {
    query = Object.assign(query, {
      update_time: new Date().getTime()
    })
    const result = await this.exe<any>("apaas_file:delete", query)

    return {
      id: !!result ? query.id : null
    };
  }

  public async renameFile(query: {
    id: number
    name: string
    description?: string
    updatorId: string
    updatorName: string
  }): Promise<{ id: number | null }> {
    query = Object.assign({}, query)

    const result = await this.exe<any>("apaas_file:rename", {
      ...query,
      update_time: new Date().getTime()
    })

    return {
      id: !!result ? query.id : null
    };
  }

  public async modifyFileType(id: number, type: string): Promise<{ id: number | null }> {
    const result = await this.exe<any>('apaas_file:modifyFileType', {
      id,
      type,
      update_time: new Date().getTime()
    });

    return {
      id: !!result ? id : null
    };
  }

  public async modifyFileDeliveryChannel(id: number, deliveryChannel: string): Promise<{ id: number | null }> {
    const result = await this.exe<any>('apaas_file:modifyFileDeliveryChannel', {
      id,
      deliveryChannel,
      updateTime: new Date().getTime()
    });

    return {
      id: !!result ? id : null
    };
  }

  public async moveFile(query: {
    fileId: number
    groupId: number
    parentId: any
  }): Promise<{ id: number | null }> {
    query = Object.assign(query, {update_time: new Date().getTime()})
    if (!query.parentId) {
      query.parentId = null
    }
    const result = await this.exe<any>("apaas_file:moveFile", query)

    return {
      id: !!result ? query.fileId : null
    };
  }

  @Mapping(FileDO)
  public async getAllFiles() {
    const result = await this.exe<any>("apaas_file:getAllFiles")

    return result
  }


  /**
   * LiangLihao
   */
  public async update(query: {
    id: number
    updatorId: string
    updatorName: string
    name?: string
    namespace?: string
    type?: string
    shareType?:number
    version?: string
    description?: string
    icon?: string
  }) {
    query = Object.assign(query, {
      updateTime: new Date().getTime()
    })

    if (typeof query.icon !== 'string') {
      query.icon = null
    }
    
    const result = await this.exe<any>('apaas_file:update', query)
    return {id: result.insertId}
  }


  /**
   * LiangLihao
   */
  @Mapping(FileDO)
  public async getFiles(query: {
    id?: number
    type?: string
    name?: string
    useLike?: any
    status?: number
    extName?: string
    groupId?: number
    groupIds?: string | string[]
    creatorId?: string
    ref?: string
    owner?: string
  }): Promise<any[]> {
    query = Object.assign({}, query)

    if (typeof query.useLike === 'undefined') {
      query.useLike = null
    } else {
      query.name = `%${query.name}%`
    }

    if (typeof query.status === 'undefined') {
      query.status = 1
    }

    // if (typeof query.groupId === 'undefined') {
    //   query.groupId = null
    // }


    const result = await this.exe<any>('apaas_file:getFiles', {
      ...query
    })

    return result
  }

  @Mapping(FileDO)
  public async getFolderTreeAry(query: {
    id: number
  }) {
    query = Object.assign({}, query)

    const result = await this.exe<any>('apaas_file:getFolderTreeAry', {
      ...query
    })

    return result
  }

  /**
   * 查询文件类型分布
   * @async
   * @function
   * @typedef {object} params
   * @property {string[]} extNames
   * @returns {{Promise<any[]>}}
   */
  public async getFileCountByExtNames(params: {
    extNames?: string[]
    startTime?: string
    endTime?: string
  }): Promise<any[]> {

    if (typeof params.extNames === 'undefined') {
      params.extNames = null
    }

    const result = await this.exe<any>(
      'apaas_file:getFileCountByExtNames',
      params
    )

    return result
  }

  @Mapping(FileDO)
  public async updateByIds(query: {
    ids: string[]
    name?: string
    icon?: string
    fileProperty?: string
    updatorId: string
    updatorName: string
  }) {
    query = Object.assign({}, query)

    const result = await this.exe<any>('apaas_file:updateByIds', {
      ...query,
      updateTime: new Date().getTime()
    })

    return result
  }

  @Mapping(FileDO)
  public async getRecycleBinFiles(query: {
    userId: string
    timeInterval: number
  }) {
    const result = await this.exe<any>('apaas_file:getRecycleBinFiles', {
      ...query,
      currentTime: new Date().getTime()
    })

    return result
  }

  public async recoverFile(query: {
    id: number,
    updatorId: string
    updatorName: string
  }) {
    const result = await this.exe<any>('apaas_file:recoverFile', {
      ...query,
      updateTime: new Date().getTime()
    })

    return {id: result.insertId}
  }

  /**
   * 查询固定时段新增文件列表
   * @async
   * @function
   * @typedef {object} params
   * @property {string} extName
   * @returns {{Promise<any[]>}}
   */
  @Mapping(FileDO)
  public async getFileListByExtName(params: {
    extName?: string
    pageIndex?: number
    pageSize?: number
    startTime: string
    endTime: string
  }): Promise<any[]> {

    const result = await this.exe<any>(
      'apaas_file:getFileListByExtName',
      params
    )

    return result
  }

  /**
   * 查询固定时段新增文件列表总数
   * @async
   * @function
   * @typedef {object} params
   * @property {string} extName
   * @returns {{Promise<any[]>}}
   */
  public async getFileListTotalByExtName(params: {
    extName?: string
    startTime: string
    endTime: string
  }): Promise<any[]> {

    const result = await this.exe<any>(
      'apaas_file:getFileListTotalByExtName',
      params
    )

    return result && result[0].total
  }
	
	/** 根据项目ID获取下面所有模块的发布记录 */
	public async getLatestFilePubsByProjectId(params: {
    projectId: number
  }) {
		const result = await this.exe<any>(
			'apaas_file:getLatestFilePubsByProjectId',
			params
		)
		
		return result
	}

  /** 或者我的文件 */
  @Mapping(FileDO)
  public async getMyFiles(params: {
    userId: string;
    parentId: number;
    extNames: string[];
    status?: number;
  }) {
    if (typeof params.status !== 'number') {
      params.status = 1
    }

    const result = await this.exe<any>(
			'apaas_file:getMyFiles',
			params
		)
		
		return result
  }
}

