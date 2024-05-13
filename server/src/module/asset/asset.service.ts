import {Injectable} from '@nestjs/common';
import * as path from 'path';
import * as axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import UploadService from '../upload/upload.service';
import AppDao from '../../dao/AppDao';
import {getRealDomain, uuid} from '../../utils';
import FlowService from '../flow/flow.service';
const env = require('../../../env');

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
      changeLog: string;
    },
    file,
    request
  ) {
    const app = await this.appDao.getAppByNamespace_Version(query.namespace, query.version);

    if (app[0]) {
      return { code: -1, message: '当前应用版本已存在，请变更版本号重试!' };
    } else if (!file.originalname?.endsWith('.zip')) {
      return { code: -1, message: '应用安装包只支持 zip 格式' };
    }

    const subPath = await this.flowService.saveFile({
      str: file.buffer,
      filename: `${query.namespace}.zip`,
      folderPath: `/asset/app/${query.namespace}/${query.version}`,
    });

    const { insertId } = await this.appDao.insertApp({
      ...query,
      install_type: InstallType.LOCAL,
      type: AssetType.APP,
      install_info: JSON.stringify({ path: subPath, origin: 'local', changeLog: query.changeLog || '优化部分逻辑，修复若干 bug' }),
      creator_name: query.creatorName || '',
      icon: query.icon || '',
      description: query.description || '',
      create_time: Date.now(),
    });

    if (!insertId) {
      return { code: -1, message: '应用发布失败，数据插入错误' };
    }
    //TODO: 目前是发布应用自动同步到中心化资产平台
    return await this.publishAppToOrigin({ appId: insertId, userId: query.creatorName || '' }, request);
    // return { code: 1, message: '应用发布成功!' };
  }

  async publishAppToOrigin(params: { appId: number; userId: string }, request) {
    const [app] = await this.appDao.getAppById(params.appId);

    if (!app) {
      return { code: -1, message: '应用不存在!' };
    }

    const formData = new FormData();
    formData.append('action', 'app_publishVersion');
    formData.append('userId', params.userId);
    formData.append('payload', JSON.stringify(app));
    const info = JSON.parse(app.installInfo ?? '{}');
    formData.append('file', fs.readFileSync(path.join(env.FILE_LOCAL_STORAGE_FOLDER, info.path)), app.namespace + '.zip');

    // const domainName = 'http://localhost:4100';
    const domainName = getRealDomain(request);
    try {
      const res = await (axios as any).post(
        `${domainName}/central/api/channel/gateway`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      if ((res.status !== 200 && res.status !== 201) || !res.data || res.data.code !== 1) {
        return { code: -1, message: '发布到中心化资产平台失败：' + res.data?.message || '' };
      } else {
        return { code: 1, message: res.data?.message || '发布到中心化资产平台成功' };
      }
    } catch(e) {
      return { code: -1, message: '发布到中心化资产平台失败：' + e.message || '' };
    }
  }
}
