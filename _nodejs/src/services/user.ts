import { Get, Controller, Body, Post, Param, Query } from "@nestjs/common";
import UserDao from "../dao/UserDao";
import { Logs } from "../utils";

@Controller("/paas/api")
export class UserServices {
  userDao: UserDao;

  constructor() {
    this.userDao = new UserDao();
  }

  @Get("/user/getAll")
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

  @Post("/user/grant")
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
        msg: "email expected.",
      };
    }
  }

  @Get("/user/queryBy")
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

  @Post("/user/register")
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

  @Post("/user/login")
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
}
