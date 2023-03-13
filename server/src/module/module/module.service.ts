import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import ModuleDao from './../../dao/ModuleDao'
import ModulePubDao from './../../dao/ModulePubDao';
const fs = require('fs-extra');
const env = require('../../../env.js')
const path = require('path');

@Injectable()
export default class ModuleService {

  private readonly ModuleDao = new ModuleDao();
  private readonly ModulePubDao = new ModulePubDao();

  async create(param) {
    const { id } = await this.ModuleDao.create(param)
    return id
  }

  async getModuleById(id: number) {

  }

  async batchCreatePubInfo(param: {
    moduleId: number,
    pubContentList: any[],
    version: string,
    creatorId: string,
    commitInfo: string,
    creatorName: string
  }) {
    const { id } = await this.ModulePubDao.batchCreate(param)
    return id
  }

  async queryByFileId(param: {
    fileId: number,
    pageSize: number,
    pageIndex: number
  }) {
    return await this.ModuleDao.queryByFileId({ fileId: param.fileId, limit: param.pageSize, offset: param.pageSize * param.pageIndex})
  }

  async getLatestPubByFileId(fileId: number) {
    return await this.ModuleDao.getLatestPubByFileId({ fileId })
  } 
}
