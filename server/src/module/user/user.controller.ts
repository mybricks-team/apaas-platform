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
import { Logs, uuidOfNumber } from '../../utils';
import UserService from './user.service';
import { Logger } from '@mybricks/rocker-commons';
import { USER_ROLE } from '../../constants'
import UserValidateDao from '../../dao/UserValidateDao';
import { sendEmail } from '../../utils/email';

@Controller('/paas/api/user')
export default class UserController {
  fileDao: FileDao;
  userDao: UserDao;
  userService: UserService;
  userSessionDao: UserSessionDao;
  userValidateDao: UserValidateDao;

  constructor() {
    this.fileDao = new FileDao();
    this.userDao = new UserDao();
    this.userService = new UserService();
    this.userSessionDao = new UserSessionDao();
    this.userValidateDao = new UserValidateDao();
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
              isAdmin: user.role === USER_ROLE.ADMIN,
              createTime: user.createTime,
            },
          ],
        };
      } else {
        return { code: 1, data: null };
      }
    } else {
      return { code: -1, msg: 'email is null' };
    }
  }

  @Post('/register')
  async register(@Body() body) {
    const { email, psd, fingerprint, captcha } = body;

    if (
      !email ||
      !email.match(/^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/) ||
      !psd ||
      /** 存在环境变量，代表使用邮箱验证码校验 */
      (process.env.MYBRICKS_EMAIL_ACCESS_KEY_ID ? !captcha : false)
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
      /** 存在环境变量，代表使用邮箱验证码校验 */
      if (process.env.MYBRICKS_EMAIL_ACCESS_KEY_ID) {
        const [captchaItem] = await this.userValidateDao.queryByUserId({ type: 'email', timeInterval: (10 * 60) * 1000, userId: email });
        if (!captchaItem || captcha !== captchaItem.captcha) {
          return { code: -1, msg: '验证码错误，请重新发送验证码' };
        }
      }
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

  @Post('/manageByManateeai')
  async manageByManateeai(@Body() body, @Headers('Bearer') token: string) {
    if(token === 'manateeai-8cce00ab0654d2c7') {
      const { action, payload } = body;
      switch(action) {
        case 'register': {
          const { nick, name, isAdmin } = payload
          // 根据userId查询用户表
          let user = await this.userDao.queryByEmail({
            email: `${nick}`,
          });
          if (!user) {
            // 头像
            const avatar: string = '/default_avatar.png';
    
            // 新建一条用户记录
            await this.userDao.create({
              name: name,
              email: `${nick}`,
              avatar,
              role: isAdmin ? USER_ROLE.ADMIN : USER_ROLE.GUEST
            });
            Logger.info(`[manateeai] 用户 ${nick }注册完成.`);
          } else {
            Logger.info(`[manateeai] 用户 ${nick } 已存在，跳过.`);
            return {
              code: -1,
              msg: '用户已存在，跳过'
            }
          }
          break
        }
        case 'update': {
          const { nick, name } = payload
          // 根据userId查询用户表
          let user = await this.userDao.queryByEmail({
            email: `${nick}`,
          });
          if (user) {
            await this.userDao.setUserInfo({
              userId: user.id,
              name
            });
            Logger.info(`[manateeai] 用户 ${nick } 更新完成.`);
          } else {
            Logger.info(`[manateeai] 用户 ${nick } 用户不存在.`);
            return {
              code: -1,
              msg: '用户不存在'
            }
          }
          break
        }
        case 'delete': {
          const { nick } = payload
          let user = await this.userDao.queryByEmail({
            email: `${nick}`,
          });
          if (user) {
            await this.userDao.deleteById({
              id: user.id
            })
            Logger.info(`[manateeai] 用户 ${nick } 删除成功.`);
          } else {
            Logger.info(`[manateeai] 用户 ${nick } 用户不存在.`);
            return {
              code: -1,
              msg: '删除失败，用户不存在'
            }
          }
          break
        }
      }
      return {
        code: 1,
        msg: '操作成功'
      }
    } else {
      return {
        code: -1,
        msg: '暂无权限'
      }
    }
    // const { email, name, avatar } = body;
    // const user = await this.userDao.queryByEmail({ email });
    // if (user) {
    //   Logs.info(`邮箱${email}已被注册.`);

    //   return {
    //     code: -1,
    //     msg: `邮箱${email}已被注册.`,
    //   };
    // } else {
    //   const { id } = await this.userDao.create({
    //     email,
    //     name,
    //     avatar
    //   });

    //   Logs.info(`新用户${email}注册完成.`);

    //   return {
    //     code: 1,
    //     data: {
    //       userId: id,
    //     },
    //   };
    // }
  }

  @Post('/login')
  async login(@Body() body) {
    const { email, psd, fingerprint } = body;

    Logs.info(`用户${email} 申请登录.`);

    const user = await this.userDao.queryByEmailWithPwd({ email })
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
  async signed(@Body() body, @Headers('username') us: string, @Request() request) {
    try {
      const { fileId, HAINIU_UserInfo } = body;
      let userEmail;

      if(us) {
        userEmail = `${us}@kuaishou.com`;
      } else {
        if(request?.cookies?.['mybricks-login-user']) {
          const userCookie = JSON.parse(request?.cookies?.['mybricks-login-user'])
          userEmail = userCookie?.email
          // 单点
          if(userCookie?.fingerprint) {
            const sess = await this.userSessionDao.queryByUserId({ userId: userCookie.id })
            if(sess?.fingerprint !== userCookie.fingerprint) {
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
            userEmail = JSON.parse(HAINIU_UserInfo)?.userInfo?.nick
          } catch(e) {
            Logger.info(e)
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
          isAdmin: userInfo.role === USER_ROLE.ADMIN,
        }
        delete data.password;
        delete data.mobilePhone;
        if (fileId) {
          const roleDescription = await this.fileDao.getRoleDescription({userId: userInfo.id, fileId})
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
      Logger.info(e)
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
    if(user.role === USER_ROLE.ADMIN) {
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

  @Post('/setUserInfo')
  async setUserInfo(
    @Body('userId') userId: number,
    @Body('name') name: string
  ) {
    if(!name || !userId) {
      return {
        code: -1,
        msg: '参数缺失'
      }
    }
    await this.userService.setUserInfo({userId, name})
    return {
      code: 1,
      msg: '设置成功'
    }
  }

  @Post('/sendCode')
  async sendCode(@Body() body) {
    const { email, isRegister } = body;

    if (!email || !email.match(/^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/)) {
      return { code: -1, msg: '邮箱格式错误' };
    }

    Logs.info(`用户${email} 申请验证码发送.`);

    /** 注册才需要校验 */
    const user = isRegister ? await this.userDao.queryByEmail({ email }) : false;
    if (user) {
      Logs.info(`邮箱${email}已被注册.`);

      return { code: -1, msg: `邮箱${email}已被注册.` };
    } else {
      const [captchaItem] = await this.userValidateDao.queryByUserId({ type: 'email', timeInterval: (3 * 60) * 1000, userId: email });

      if (captchaItem) {
        return { code: -1, msg: '验证码已发送，请不要频繁操作' };
      }

      // TODO: 还需要做更详细频率控制，因为 sendEmail 本身需要 3s 左右，这段时间内能频繁触发请求
      const captcha = uuidOfNumber();
      await sendEmail({
        to: email,
        subject: `Mybricks 验证码：“${captcha}”`,
        html: `
          <!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.=w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>
          <html>
            <head>
              <base target=='_blank' />
              <style type='text/css'>
                ::-webkit-scrollbar {
                  display: none;
                }
              </style>
              <style id='cloudAttachStyle' type='text/css'>
                #divNeteaseBigAttach,
                #divNeteaseBigAttach_bak {
                  display: none;
                }
              </style>
            </head>
            <body tabindex='0' role='listitem'>
              <div id='content' class='netease_mail_readhtml'>
                <table cellpadding='0' cellspacing='0' border='0' id='backgroundTable' width='100%' style='background-color: #f3f5f8' microsoft='' yahei=''>
                  <tbody>
                    <tr>
                      <td>
                        <table
                            cellpadding='0'
                            cellspacing='0'
                            border='0'
                            align='center'
                            width='600'
                            style='border-collapse: collapse; background-color: #fff; border-radius: 4px; margin-top: 40px; margin-bottom: 40px; '
                        >
                          <tbody>
                            <tr>
                              <td valign='top'>
                                <table
                                    cellpadding='0'
                                    cellspacing='0'
                                    width='580'
                                    align='center'
                                    style='border-collapse: collapse; margin: 40px'
                                >
                                  <tbody>
                                    <tr>
                                      <td height='50' valign='top'>
                                        <img border='0' style='display: block' width='100' height='100' src="https://my.mybricks.world/icon.png" />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td valign='top'>
                                        <p style=' margin-top: 24px; margin-bottom: 0; font-size: 32px; font-weight: 500; text-align: left; color: #333333; line-height: 40px; '>
                                          您正在使用 Mybricks aPaas 平台
                                        </p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td valign='top'>
                                        <p style=' margin-top: 0; margin-bottom: 0; font-size: 32px; font-weight: 500; text-align: left; color: #333333; line-height: 40px; ' >
                                          请输入此验证码以完成邮箱验证。
                                        </p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td valign='top'>
                                        <p style=' margin-top: 28px; margin-bottom: 7px; font-size: 64px; font-weight: 500; text-align: left; color: #333333; line-height: 90px; ' >
                                          ${captcha}
                                        </p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td valign='top'>
                                        <p style=' margin-top: 0; margin-bottom: 282px; font-size: 14px; font-weight: 400; color: #999999; line-height: 17px; ' >
                                          验证码 10 分钟内有效，请尽快验证。
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <style type='text/css'>
                body {
                  font-size: 14px;
                  font-family: arial, verdana, sans-serif;
                  line-height: 1.666;
                  padding: 0;
                  margin: 0;
                  overflow: auto;
                  white-space: normal;
                  word-wrap: break-word;
                  min-height: 100px;
                }
                td, input, button, select, body {
                  font-family: Helvetica, 'Microsoft Yahei', verdana;
                }
                pre {
                  white-space: pre-wrap;
                  white-space: -moz-pre-wrap;
                  white-space: -moz-pre-wrap;
                  white-space: -o-pre-wrap;
                  word-wrap: break-word;
                  width: 95%;
                }
                th, td {
                  font-family: arial, verdana, sans-serif;
                  line-height: 1.666;
                }
                img {
                  border: 0;
                }
                header, footer, section, aside, article, nav, hgroup, figure, figcaption {
                  display: block;
                }
                blockquote {
                  margin-right: 0;
                }
              </style>
              <style id='netease_ail_footer_style' type=3D'text/css'>
                #netease_mail_footer {
                  display: none;
                }
              </style>
              <style id='ntes_link_color' type=3D'text/css'>
                a, td a {
                  color: #064977;
                }
              </style>
              <audio controls='controls' style='display: none'></audio>
            </body>
          </html>
        `,
      });
      await this.userValidateDao.create({ userId: email, type: 'email', captcha });
      Logs.info(`新用户${email}验证码（${captcha}）发送成功.`);

      return { code: 1, data: null };
    }
  }

  @Post('/findPassword')
  async findPassword(@Body() body) {
    const { email, password, confirmPassword, captcha } = body;

    if (!email || !email.match(/^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/)) {
      return { code: -1, msg: '邮箱格式错误' };
    } else if (!password || password !== confirmPassword) {
      return { code: -1, msg: '两次密码不一致，请检查密码' };
    }

    const [user] = await this.userDao.queryByEmails({ emails: [email] });

    if (!user) {
      return { code: -1, msg: '该邮箱号未被注册过，请前往注册' };
    }
    const [captchaItem] = await this.userValidateDao.queryByUserId({ type: 'email', timeInterval: (10 * 60) * 1000, userId: email });
    if (!captchaItem || captcha !== captchaItem.captcha) {
      return { code: -1, msg: '验证码错误，请重新发送验证码' };
    }

    await this.userDao.updateUser({ email, password });

    return { code: 1, data: null };
  }
}
