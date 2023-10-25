import { Injectable } from '@nestjs/common';
const env = require('../../../env.js')
import UploadService from '../upload/upload.service';
import { DOMAIN_EXE_CODE_TEMPLATE } from './domain.template'

@Injectable()
export default class DomainService {
  uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  async batchCreateService({ fileId, serviceContentList, projectId }) {
    let folderPath = `/project/${fileId}`;
    if(projectId) {
      if(fileId) {
        folderPath = `/project/${projectId}/${fileId}`;
      } else {
        folderPath = `/project/${projectId}`;
      }
    }
    const cdnList = await Promise.all(
      serviceContentList.map((serviceContent) => {
        let newStr = decodeURIComponent(serviceContent.code).replace('//@external_dep', DOMAIN_EXE_CODE_TEMPLATE)
        return this.uploadService.saveFile({
          str: newStr,
          filename: `${serviceContent.id}.js`,
          folderPath: folderPath
        });
      }),
    );
    if (Array.isArray(cdnList) && cdnList.length && !cdnList.some((url) => !url)) {
      return cdnList?.map(subPath => `/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`)
    }
  }
}
