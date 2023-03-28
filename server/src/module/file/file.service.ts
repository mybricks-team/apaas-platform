import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import FileContentDao from "../../dao/FileContentDao";
import FileDao from "../../dao/FileDao";
import FilePubDao from "../../dao/filePub.dao";

@Injectable()
export default class FileService {
  fileDao: FileDao;
  fileContentDao: FileContentDao;
  filePubDao: FilePubDao;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
    this.filePubDao = new FilePubDao();
  }

  async getAllShareFiles(params?: { pageSize?: number, page?: number }): Promise<any> {
    const { pageSize, page } = params || {};
    const files = await this.fileDao.getAllShareFiles({
      pageSize,
      page,
      shareType: 1,
    });
    return files
  }

  async getCountOfShareFiles(): Promise<any> {
    const files = await this.fileDao.getCountOfShareFiles({
      shareType: 1,
    });
    return files
  }
}
