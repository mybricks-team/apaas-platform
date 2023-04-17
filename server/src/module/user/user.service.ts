import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import UserDao from '../../dao/UserDao';

@Injectable()
export default class UserService {
  userDao: UserDao;

  constructor() {
    this.userDao = new UserDao();
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

  
  
  
}
