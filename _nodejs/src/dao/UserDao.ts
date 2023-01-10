import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

/**
 * UserDO
 * @param id         主键
 * @param userId     用户id
 * @param name       用户中文名
 * @param userName   用户名
 * @param avatar     用户头像
 * @param department 所属部门
 * @param email      用户邮箱
 * @param status     状态
 * @param createTime 创建时间
 * @param updateTime 更新时间
 */
export class UserDO {
  @Column
  id: number

  @Column
  name: string

  @Column
  email: string

  @Column('mobile_phone')
  mobilePhone: number

  @Column
  password: string

  @Column('license_code')
  licenseCode: string

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column('update_time')
  updateTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }

  @Column
  status: number

  @Column
  role: number

  get isAdmin() {
    return this.email === 'chemingjun@126.com'
  }

  verifyPassword(psd: string) {
    return this.password === psd
  }
}

export default class UserDao extends DOBase {
  @Mapping(UserDO)
  public async queryAll(): Promise<UserDO[]> {
    const result = await this.exe<any>(
      'apaas_user:queryAll'
    )

    return result
  }

  @Mapping(UserDO)
  public async queryByEmail(params: {
    email: string
  }): Promise<UserDO> {
    params = Object.assign({status: 1}, params)

    const result = await this.exe<any>(
      'apaas_user:queryByEmail',
      params
    )

    return result && result.length > 0 ? result[0] : void 0
  }

  @Mapping(UserDO)
  public async queryByEmails(params: {
    emails: string[]
  }): Promise<UserDO> {
    params = Object.assign({status: 1}, params)

    const result = await this.exe<any>(
      'apaas_user:queryByEmails',
      params
    )

    return result
  }


  public async grantLisenseCode(params: {
    email: string
  }): Promise<number> {
    params = Object.assign({
      updateTime: new Date().getTime(),
      licenseCode: `0000-0000-0000-0000`
    }, params)

    const result = await this.exe<any>(
      'apaas_user:updateLisenceCode',
      params
    )

    return result
  }

  /**
   * 注册
   * @async
   * @function
   * @typedef  {object} params
   * @returns  {Promise<any>}
   */
  @Mapping(UserDO)
  public async create(params: {
    email: string
    password: string
    role?: number
  }): Promise<any> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user:insert',
      Object.assign(
        params,
        {
          createTime: new Date().getTime(),
          updateTime: new Date().getTime(),
          role: params.role ?? 1
        }
      )
    )

    return {id: result.insertId}
  }
}