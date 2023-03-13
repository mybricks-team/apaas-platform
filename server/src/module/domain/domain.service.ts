import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
const fs = require('fs-extra');
const env = require('../../../env.js')
const path = require('path');
import UploadService from '../upload/upload.service';
import { DOMAIN_EXE_CODE_TEMPLATE } from './domain.template'

@Injectable()
export default class DomainService {
  uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  async batchCreateService({ fileId, serviceContentList, projectId }, { domainName }) {
    let folderPath = `/project/${fileId}`;
    if(projectId) {
      folderPath = `/project/${projectId}/${fileId}`;
    }
    const cdnList = await Promise.all(
      serviceContentList.map((serviceContent) => {
        return this.uploadService.saveFile({
          str: `
            ${DOMAIN_EXE_CODE_TEMPLATE}
            ${decodeURIComponent(serviceContent.code)}
          `,
          filename: `${serviceContent.id}.js`,
          folderPath: folderPath
        });
      }),
    );
    if (
      Array.isArray(cdnList) &&
      cdnList.length &&
      !cdnList.some((url) => !url)
    ) {
      return cdnList?.map((subPath) => {
        return `${domainName}/${env.FILE_LOCAL_STORAGE_PREFIX}${subPath}`
      })
    }
  }
}
