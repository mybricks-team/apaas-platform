import { Body, Controller, Get, Res, Post, Query } from "@nestjs/common";

import UserGroupDao from "../../dao/UserGroupDao";
import UserGroupRelationDao from "../../dao/UserGroupRelationDao";

@Controller("/paas/api/userGroup")
export default class GroundService {
  userGroupDao: UserGroupDao;
  userGroupRelationDao: UserGroupRelationDao;
  
  constructor() {
    this.userGroupDao = new UserGroupDao();
    this.userGroupRelationDao = new UserGroupRelationDao();
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
    const { email, id } = query
    const user = await this.userGroupRelationDao.queryByUserIdAndUserGroupId({userId: email, userGroupId: id})

    return {
      code: 1,
      data: user
    }
  }
}
