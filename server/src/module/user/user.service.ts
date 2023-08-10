import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import UserDao from '../../dao/UserDao';
import UserSessionDao from './../../dao/UserSessionDao';

@Injectable()
export default class UserService {
  userDao: UserDao;
  userSessionDao: UserSessionDao;

  constructor() {
    this.userDao = new UserDao();
    this.userSessionDao = new UserSessionDao();
  }


  async queryByRoleAndName(param) {
    return await this.userDao.queryByRoleAndName(param);
  }

  async getTotalCountByParam({ role, email }) {
    return await this.userDao.getTotalCountByParam({ role, email });
  }

  async setUserRole({ role, email }) {
    return await this.userDao.setUserRole({email,role});
  }

  async queryByEmail({ email }) {
    return await this.userDao.queryByEmail({email});
  }

  async createOrUpdateFingerprint({ userId, fingerprint }) {
    const sess = await this.userSessionDao.queryByUserId({ userId });
    if (sess) {
      await this.userSessionDao.updateFingerprintByUserId({ userId, fingerprint });
    } else {
      await this.userSessionDao.create({ userId, fingerprint })
    }
  }
  
  
}
