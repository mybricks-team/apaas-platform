import UserSessionDao from './../../dao/UserSessionDao';
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
  userSessionDao: UserSessionDao;

  constructor() {
    this.fileDao = new FileDao();
    this.userDao = new UserDao();
    this.userService = new UserService();
    this.userSessionDao = new UserSessionDao();
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

  @Post('/searchByKeyword')
  async searchByKeyword(@Body('keyword') keyword: string) {
    if (keyword) {
      const list: any = await this.userDao.searchByKeyword({ keyword })
      if (list) {
        return {
          code: 1,
          data: list?.map((user) => {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
            }
          }),
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
              name: user.name,
              avatar: user.avatar,
              isAdmin: user.role === 10,
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
    const { email, psd, fingerprint } = body;

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

      if(fingerprint) {
        // 刷新登录态
        await this.userService.createOrUpdateFingerprint({ userId: id, fingerprint })
      }

      Logs.info(`新用户${email}注册完成.`);

      return {
        code: 1,
        data: {
          userId: id,
        },
      };
    }
  }

  @Post('/addUser')
  async addUser(@Body() body) {
    const { email, name, avatar } = body;
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
        name,
        avatar
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
    const { email, psd, fingerprint } = body;

    Logs.info(`用户${email} 申请登录.`);

    const user = await this.userDao.queryByEmail({ email });
    if (user) {
      if (user.verifyPassword(psd)) {
        Logs.info(`用户${email} 登录成功.`);
        if(fingerprint) {
          // 刷新登录态
          await this.userService.createOrUpdateFingerprint({ userId: user.id, fingerprint })
        }

        return {
          code: 1,
          data: Object.assign({}, {
            id: user.id,
            email: user.email
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
          // 单点
          if(userCookie?.fingerprint) {
            const sess = await this.userSessionDao.queryByUserId({ userId: userCookie.id })
            if(sess.fingerprint !== userCookie.fingerprint) {
              return {
                code: -1,
                msg: '当前账号已在其他设备登录，请重新登录'
              }
            }
          }
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
        delete data.password;
        delete data.mobilePhone;
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
    @Body('userId') userId: string,
    @Body('role') role: number,
    @Body('updatorId') updatorId: string
  ) {
    if(!userId || !role || !updatorId) {
      return {
        code: -1,
        msg: '参数缺失'
      }
    }
    const user = await this.userDao.queryById({ id: updatorId })
    if(user.role === 10) {
      await this.userService.setUserRole({userId: userId, role})
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

  @Post('/queryCurrentSession')
  async queryCurrentSession(@Body('userId') userId: number) {
    if(!userId) {
      return {
        code: -1,
        msg: '参数缺失'
      }
    }
    const res  = await this.userSessionDao.queryByUserId({userId})
    return {
      code: 1,
      data: res
    }
  }
}
