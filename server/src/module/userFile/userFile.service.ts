import { Inject, Injectable } from '@nestjs/common';
import UserFileRelationDao from '../../dao/UserFileRelationDao';

@Injectable()
export default class UserFileService {

  userFileRelationDao: UserFileRelationDao;

  constructor() {
    this.userFileRelationDao = new UserFileRelationDao();
  }

  async getFileUserInfoByFileIdAndUserId(query: {
    fileId: number;
    userId: string;
  }) {
    return await this.userFileRelationDao.query(query);
  }
}
