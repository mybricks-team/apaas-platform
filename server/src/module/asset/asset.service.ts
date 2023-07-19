import {Injectable} from '@nestjs/common';
import * as path from 'path';
import UploadService from '../upload/upload.service';
import AppDao from '../../dao/AppDao';
import {uuid} from '../../utils';
import FlowService from '../flow/flow.service';

enum InstallType {
  NPM = 'npm',
  HTTP = 'http',
  LOCAL = 'local',
}
export enum AssetType {
  MATERIAL = 'material',
  APP = 'app'
}

@Injectable()
export default class AssetService {
  uploadService: UploadService;
  flowService: FlowService;
  appDao: AppDao

  constructor() {
    this.uploadService = new UploadService();
    this.flowService = new FlowService();
    this.appDao = new AppDao();
  }

  async publishAPP(
    query: {
      name: string;
      namespace: string;
      icon: string;
      description: string;
      version: string;
      creatorName: string;
    },
    file
  ) {
    const app = await this.appDao.getAppByNamespace_Version(query.namespace, query.version);

    if (app[0]) {
      return { code: -1, message: '当前应用版本已存在，请变更版本号重试!' };
    } else if (!file.originalname?.endsWith('.zip')) {
      return { code: -1, message: '应用安装包只支持 zip 格式' };
    }

    const subPath = await this.flowService.saveFile({
      str: file.buffer,
      filename: `${uuid()}-${new Date().getTime()}${path.extname(file.originalname)}`,
      folderPath: `/asset/app/${query.namespace}/${query.version}`,
    });

    await this.appDao.insertApp({
      ...query,
      install_type: InstallType.LOCAL,
      type: AssetType.APP,
      install_info: JSON.stringify({ path: subPath }),
      creator_name: query.creatorName || '',
      icon: query.icon || '',
      description: query.description || '',
      create_time: Date.now(),
    });

    return { code: 1, message: '应用发布成功!' };
  }

  async publishAppToOrigin(appId: number) {
    // TODO: 发布到中心化资产
  }
}
