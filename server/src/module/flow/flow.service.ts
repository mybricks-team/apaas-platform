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
  async batchCreateProjectFile({ codeStrList, projectId }: { codeStrList: {fileId: number, fileName: string, content: string}[], projectId: number}, { domainName }): Promise<{fileId: number, url: string}[]> {
    let folderPath = `/project`;
    if(projectId) {
      folderPath = `/project/${projectId}`;
    }
    const cdnList = await Promise.all(
      codeStrList.map((codeContent) => {
        return this.uploadService.saveFile({
          str: codeContent.content,
          filename: codeContent.fileName,
          folderPath: `${folderPath}/${codeContent.fileId}`
        });
      }),
    );
    if (
      Array.isArray(cdnList) &&
      cdnList.length &&
      !cdnList.some((url) => !url)
    ) {
      return cdnList?.map((subPath, index) => {
        return {
          fileId: codeStrList[index].fileId,
          url: `${domainName}/${env.FILE_LOCAL_STORAGE_PREFIX_RUNTIME}${subPath}`
        }
      })
    }
  }

  async batchDeleteServiceFileOfProject({ serviceList, projectId }: { serviceList: {fileId: number, serviceId: string}[], projectId: number}) {
    let folderPath = `/project`;
    if(projectId) {
      folderPath = `/project/${projectId}`;
    }
    await Promise.all(
      serviceList.map(({fileId, serviceId}) => {
        let tempPath = `${folderPath}/${fileId}/${serviceId}.js`;
        return this.uploadService.deleteFile({
          subPath: tempPath
        });
      }),
    );
    return true;
  }

  async batchDeleteServiceFile({ serviceFilesFullPath }: { serviceFilesFullPath: string[]}) {
    await Promise.all(
      serviceFilesFullPath.map((serviceFileFullPath) => {
        return this.uploadService.deleteFile({
          fullPath: serviceFileFullPath
        });
      }),
    );
    return true;
  }



  async getOnlineServiceOfProjectAndFile({ projectId, domainFileId }: { projectId: number, domainFileId: number }) {
    let folderPath = `/project`;
    if(projectId) {
      folderPath = `/project/${projectId}`;
    }
    folderPath = `${folderPath}/${domainFileId}`
    const files = this.uploadService.getFiles({ subPath: folderPath })
    return files
  }

  async saveFile(params: any) {
    return await this.uploadService.saveFile(params)
  }
}
