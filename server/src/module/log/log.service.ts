import { Injectable } from '@nestjs/common';
import UserLogDao from '../../dao/UserLogDao';

@Injectable()
export default class LogService {

  userLogDao: UserLogDao;

  constructor() {
    this.userLogDao = new UserLogDao()
  }

  async getOperateLog(param: { limit: number, offset: number }) {
    const [total, list] = await Promise.all([
      this.userLogDao.queryTotalOfAll(),
      this.userLogDao.queryDetailOfAll(param)
    ]);
    return {
      total,
      list
    }

  }

}
