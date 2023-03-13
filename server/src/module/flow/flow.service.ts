import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
const fs = require('fs-extra');
const env = require('../../../env.js')
const path = require('path');
import UploadService from '../upload/upload.service';

@Injectable()
export default class FlowService {
  uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  // 模块安装时，发布到运行容器
  // fileName示例：a.html
  async batchCreateProjectFile({ fileId, codeStrList, projectId }: { fileId: number, codeStrList: {fileName: string, content: string}[], projectId: number}, { domainName }) {
    let folderPath = `/project/${fileId}`;
      if(projectId) {
        folderPath = `/project/${projectId}/${fileId}`;
      }
      const cdnList = await Promise.all(
        codeStrList.map((codeContent) => {
          return this.uploadService.saveFile({
            str: codeContent.content,
            filename: codeContent.fileName,
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

  async saveFile(params: any) {
    return await this.uploadService.saveFile(params)
  }
}
