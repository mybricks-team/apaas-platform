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
import FileDao from '../../dao/FileDao';
import UserDao from '../../dao/UserDao';
import { Logs } from '../../utils';
import UserService from './user.service';

@Controller('/paas/api/user')
export default class UserController {
  fileDao: FileDao;
  userDao: UserDao;
  userService: UserService;

  constructor() {
    this.fileDao = new FileDao();
    this.userDao = new UserDao();
    this.userService = new UserService();
  }

  @Get('/getAll')
  async getAll() {
    const userAry = await this.userDao.queryAll();
    if (userAry) {
      return {
        code: 1,
        data: userAry.map((user) => {
          return {
            id: user.id,
            email: user.email,
            licenseCode: user.licenseCode,
            createTime: user.createTime,
          };
        }),
      };
    } else {
      return {
        code: 1,
        data: null,
      };
    }
  }

  @Post('/grant')
  async grantLisence(@Body() body) {
    const { email } = body;
    if (email) {
      const flag = await this.userDao.grantLisenseCode({ email });
      if (flag) {
        return {
          code: 1,
        };
      } else {
        return {
          code: 1,
          data: null,
        };
      }
    } else {
      return {
        code: -1,
        msg: 'email expected.',
      };
    }
  }

  @Get('/queryBy')
  async queryBy(@Query() query) {
    if (query.email) {
      const user = await this.userDao.queryByEmail({ email: query.email });
      if (user) {
        return {
          code: 1,
          data: [
            {
              id: user.id,
              email: user.email,
              isAdmin: user.role === 10,
              licenseCode: user.licenseCode,
              createTime: user.createTime,
            },
          ],
        };
      } else {
        return {
          code: 1,
          data: null,
        };
      }
    } else {
      return {
        code: -1,
        msg: `email is null`,
      };
    }
  }

  @Post('/register')
  async register(@Body() body) {
    const { email, psd } = body;

    if (
      !email ||
      !email.match(/^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/) ||
      !psd
    ) {
      return {
        code: -1,
        msg: `数据错误.`,
      };
    }

    Logs.info(`用户${email} 申请注册.`);

    const user = await this.userDao.queryByEmail({ email });
    if (user) {
      Logs.info(`邮箱${email}已被注册.`);

      return {
        code: -1,
        msg: `邮箱${email}已被注册.`,
      };
    } else {
      const { id } = await this.userDao.create({
        email,
        password: psd,
      });

      Logs.info(`新用户${email}注册完成.`);

      return {
        code: 1,
        data: {
          userId: id,
        },
      };
    }
  }

  @Post('/login')
  async login(@Body() body) {
    const { email, psd } = body;

    Logs.info(`用户${email} 申请登录.`);

    const user = await this.userDao.queryByEmail({ email });
    if (user) {
      if (user.verifyPassword(psd)) {
        Logs.info(`用户${email} 登录成功.`);

        return {
          code: 1,
          data: Object.assign(user.isAdmin ? { isAdmin: 1 } : {}, {
            id: user.id,
            email: user.email,
            licenseCode: user.licenseCode,
          }),
        };
      } else {
        return {
          code: -1,
          msg: `用户名或密码错误.`,
        };
      }
    } else {
      return {
        code: -1,
        msg: `用户名或密码错误.`,
      };
    }
  }

  /**
   * 已登录用户
   */
  @Post('/signed')
  async signed(
    @Headers('username') us: string, 
    @Request() request, @Body() body,
    @Body('HAINIU_UserInfo') HAINIU_UserInfo: string,
  ) {
    try {

      const { fileId } = body
      let userEmail;
      if(us) {
        userEmail = `${us}@kuaishou.com`;
      } else {
        if(request.cookies?.['mybricks-login-user']) {
          const userCookie = JSON.parse(request.cookies?.['mybricks-login-user'])
          userEmail = userCookie?.email
        } else if(HAINIU_UserInfo) {
          const userCookie = JSON.parse(HAINIU_UserInfo)
          userEmail = userCookie?.email
          try {
            userEmail = JSON.parse(HAINIU_UserInfo)?.userInfo?.name
          } catch(e) {
            console.log(e)
          }
        }
      }
      if (!userEmail) {
        return {
          code: -1,
          msg: '未登录',
        };
      }
      const userInfo = await this.userDao.queryByEmail({
        email: userEmail,
      });
      if (userInfo) {
        const data: any = {
          ...userInfo,
          isAdmin: userInfo.role === 10,
        }
        if (fileId) {
          const roleDescription = await this.fileDao.getRoleDescription({userId: userEmail, fileId})
          data.roleDescription = roleDescription
        }
        
        return {
          code: 1,
          data,
        };
      } else {
        return {
          code: -1,
          msg: '未登录',
        };
      }
    } catch(e) {
      console.log(e)
      return {
        code: -1,
        msg: e.message || '获取用户态失败'
      }
    }
  }

  @Post('/queryByRoleAndName')
  async queryByRoleAndName(
    @Body('role') role: number, 
    @Body('email') email: string, 
    @Body('page') page: number, 
    @Body('pageSize') pageSize: number
  ) {
    const param = {
      role,
      email,
      page,
      pageSize
    }
    const [list, total] = await Promise.all([
      this.userService.queryByRoleAndName(param),
      this.userService.getTotalCountByParam({ role, email })
    ])
    return {
      code: 1,
      data: {
        list, 
        pagination: {
          page,
          pageSize,
        },
        total
      }
    }
  }

  @Post('/setUserRole')
  async setUserRole(
    @Body('email') email: string,
    @Body('role') role: number,
    @Body('updator') updator: string
  ) {
    if(!email || !role || !updator) {
      return {
        code: -1,
        msg: '参数缺失'
      }
    }
    const user = await this.userService.queryByEmail({ email: updator })
    if(user.role === 10) {
      await this.userService.setUserRole({email,role})
      return {
        code: 1,
        msg: '设置成功'
      }
    } else {
      return {
        code: -1,
        msg: '暂无权限操作'
      }
    }
  }
}
