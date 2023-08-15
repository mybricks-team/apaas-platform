import {
  Get,
  Controller,
  Body,
  Post,
  Param,
  Headers,
  Query,
  Request,
} from '@nestjs/common';
import { Logs } from '../utils';
import UserDao from '../dao/UserDao'
import UserGroupDao from '../dao/UserGroupDao'
import UserGroupRelation from '../dao/UserGroupRelationDao'

@Controller('/paas/api')
export default class UserGroupService {
  userDao: UserDao;
  userGroupDao: UserGroupDao;
  userGroupRelation: UserGroupRelation;

  constructor() {
    this.userDao = new UserDao();
    this.userGroupDao = new UserGroupDao();
    this.userGroupRelation = new UserGroupRelation();
  }

  @Post('/userGroup/create')
  async create(@Body() body) {
    const { userId, name, icon } = body;
    if (!userId) {
      return {
        code: -1,
        message: '未获取userId',
      };
    }

    try {
      const user = await this.userDao.queryById({id: userId})
      if (!user) {
        return {
          code: -1,
          message: '用户不存在'
        };
      }
      const rtn = await this.userGroupDao.create({
        name,
        icon,
        creatorId: userId
      })
      const userGroupId = rtn.insertId

      await this.userGroupRelation.create({
        creatorId: userId,
        userId,
        roleDescription: 1,
        userGroupId
      })

      return {
        code: 1,
        data: { id: rtn.insertId },
      };
    } catch (ex) {
      console.log(ex)
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post('/userGroup/rename')
  async rename(@Body() body) {
    const { userId, name, id } = body;
    if (!userId) {
      return {
        code: -1,
        message: '未获取userId',
      };
    }

    try {
      const user = await this.userDao.queryByEmail({email: userId})
      if (!user) {
        return {
          code: -1,
          message: '用户不存在'
        };
      }

      await this.userGroupDao.update({
        id,
        name,
        updatorId: userId,
        updatorName: user.name || userId
      })

      return {
        code: 1,
        data: { id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Post('/userGroup/update')
  async update(@Body() body) {
    const { userId, name, id, icon } = body;
    if (!userId) {
      return {
        code: -1,
        message: '未获取userId',
      };
    }

    try {
      const user = await this.userDao.queryById ({id: userId})
      if (!user) {
        return {
          code: -1,
          message: '用户不存在'
        };
      }

      await this.userGroupDao.update({
        id,
        name,
        icon,
        updatorId: userId,
        updatorName: user.name || userId
      })

      return {
        code: 1,
        data: { id },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get('/userGroup/getVisibleGroups')
  async getVisibleGroups(@Query() query) {
    const { userId } = query
    const userGroupRelations = await this.userGroupRelation.queryByUserId({userId})
    let data = []

    if (userGroupRelations.length) {
      data = await this.userGroupDao.queryByIds({ids: userGroupRelations.map((item) => item.userGroupId)})
    }

    const map = new Map(userGroupRelations.map((item) => [item.userGroupId, item]))

    data = data.map((item) => {
      return {
        ...item,
        roleDescription: map.get(item.id).roleDescription
      }
    })

    return {
      code: 1,
      data
    }
  }

  @Post('/userGroup/delete')
  async delete(@Body() body) {
    const { id, userId } = body

    const user = await this.userDao.queryByEmail({email: userId})
    const result = await this.userGroupDao.delete({id, updatorId: user.email, updatorName: user.name || user.email })

    if (result.changedRows !== 0) {
      return {
        code: 1,
        data: {}
      }
    } else {
      return {
        code: -1,
        message: '仅创建人可删除'
      }
    }
  }

  @Get('/userGroup/queryById')
  async queryById(@Query() query) {
    const [group] = await this.userGroupDao.queryByIds({ids: [query.id]})

    return {
      code: 1,
      data: group
    }
  }

  @Post('/userGroup/addUserGroupRelation')
  async addUserGroupRelation(@Body() body) {
    const { userId, userIds, roleDescription = 2, groupId } = body

    const result = []

    const [user, users] = await Promise.all([
      await this.userDao.queryById({id: userId}),
      await this.userDao.queryByIds({ids: userIds})
    ]) as any

    userIds.forEach((userId) => {
      if (!users?.find((user) => user.id == userId)) {
        result.push({userId, status: -1})
      }
    })

    await Promise.all((users as any).map(async (item) => {
      if (item.id == userId) {
        return
      }
      const hasUser = await this.userGroupRelation.queryByUserIdAndUserGroupId({userId: item.id, userGroupId: groupId})
      if (hasUser) {
        if (hasUser.status === -1) {
          result.push({userId: item.id, status: 1})
          await this.userGroupRelation.update({
            updatorId: userId,
            userGroupId: groupId,
            userId: item.id,
            roleDescription
          })
        }
      } else {
        result.push({userId: item.id, status: 1})
        await this.userGroupRelation.create({
          creatorId: userId,
          userGroupId: groupId,
          userId: item.id,
          roleDescription
        })
      }
    }))

    return {
      code:1,
      data: result
    }
  }

  @Get('/userGroup/getGroupInfoByGroupId')
  async getGroupInfoByGroupId(@Query() query) {
    const { id, pageIndex, pageSize, userId } = query
    const [group, groupUsers, userTotal, userGroupRelation] = await Promise.all([
      await this.userGroupDao.queryById({id}),
      await this.userGroupRelation.queryByUserGroupId({userGroupId: id, limit: Number(pageSize), offset: Number(pageSize) * (Number(pageIndex) - 1)}),
      await this.userGroupRelation.queryUserTotalByUserGroupId({userGroupId: id}),
      await this.userGroupRelation.queryByUserIdAndUserGroupId({userId, userGroupId: id})
    ])

    return {
      code: 1,
      data: {
        ...group,
        userTotal,
        userGroupRelation,
        users: groupUsers.map((user: any) => {
          const { role_description, ...other } = user
          return {...other, roleDescription: role_description}
        })
      }
    }
  }

  @Get('/userGroup/getGroupUsersByGroupId')
  async getGroupUsersByGroupId(@Query() query) {
    const { id, pageIndex, pageSize } = query
    const [users, total] = await Promise.all([
      await this.userGroupRelation.queryByUserGroupId({userGroupId: id, limit: Number(pageSize), offset: Number(pageSize) * (Number(pageIndex) - 1)}),
      await this.userGroupRelation.queryUserTotalByUserGroupId({userGroupId: id})
    ])
    return {
      code: 1,
      data: {
        users: users.map((user: any) => {
          const { role_description, ...other } = user
          return {...other, roleDescription: role_description}
        }),
        total
      }
    }
  }

  @Post('/userGroup/updateUserGroupRelation')
  async updateUserGroupRelation(@Body() body) {
    const { id, userId, operatedUserId } = body
    const roleDescription = Number(body.roleDescription)
    const [user, userGroupRelation] = await Promise.all([
      await this.userDao.queryById({ id: userId }),
      await this.userGroupRelation.queryByUserIdAndUserGroupId({userId, userGroupId: id})
    ])

    if (userGroupRelation?.roleDescription === 1) {
      const params: any = {
        updatorId: userId,
        userGroupId: id,
        userId: operatedUserId,
      }
      switch (true) {
        case roleDescription === 1:
        case roleDescription === 2:
        case roleDescription === 3:
          params.roleDescription = roleDescription
          break
        case roleDescription === -1:
          params.status = -1
          break
        default:
          break
      }

      await this.userGroupRelation.update(params)
      return {
        code: 1,
        data: {}
      }
    } else {
      return {
        code: -1,
        msg: '无权操作'
      }
    }
  }

  @Get('/userGroup/getUserGroupRelation')
  async getUserGroupRelation(@Query() query) {
    const { userId, id } = query
    const userGroupRelation = await this.userGroupRelation.queryByUserIdAndUserGroupId({userId, userGroupId: id, status: 1})

    return {
      code: 1,
      data: userGroupRelation
    }
  }
}
