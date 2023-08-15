import { Body, Controller, Get, Res, Post, Query } from "@nestjs/common";
import UserGroupDao from '../../dao/UserGroupDao';
import UserGroupRelationDao from '../../dao/UserGroupRelationDao';
import UserService from '../user/user.service';

@Controller("/paas/api/userGroup")
export default class GroundService {
  userGroupDao: UserGroupDao;
  userGroupRelationDao: UserGroupRelationDao;
  userService: UserService;
  
  constructor() {
    this.userGroupDao = new UserGroupDao();
    this.userGroupRelationDao = new UserGroupRelationDao();
    this.userService = new UserService();
  }

  @Get("/getUserGroup")
  async getUserGroup(@Query() query) {
    const { id } = query

    const userGroup = await this.userGroupDao.queryById({id})

    return {
      code: 1,
      data: userGroup
    }
  }

  @Get("/getUser")
  async getUser(@Query() query) {
    const { email, userId: originUserId, id } = query
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const user = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({userId, userGroupId: id})

    return {
      code: 1,
      data: user
    }
  }
}
