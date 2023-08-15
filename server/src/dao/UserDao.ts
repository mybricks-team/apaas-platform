import { genMainIndexOfDB } from '../utils';
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

  @Column
  avatar: string

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
  public async queryByRoleAndName(param): Promise<UserDO[]> {
    let newParam: any = {
      limit: param.pageSize || 10,
      offset: ((param.page || 1) - 1) * (param.pageSize || 10)
    }
    if(param.role) {
      newParam.role = param.role
    }
    if(param.email) {
      newParam.email = param.email
    }
    const result = await this.exe<any>(
      'apaas_user:queryByRoleAndName',
      newParam
    )
    return result
  }

  public async getTotalCountByParam({ role, email }): Promise<any> {
    const result = await this.exe<any>(
      'apaas_user:totalCountByParam',
      { role, email }
    )
    return result?.[0] ? result?.[0]?.total : null
  }

  public async setUserRole(param: { role, userId }): Promise<any> {
    let newParam = {
      ...param,
      updateTime: Date.now()
    }
    const result = await this.exe<any>(
      'apaas_user:setUserRole',
      newParam
    )
    return result?.[0] ? result?.[0]?.total : null
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
  public async queryById(params: {
    id: string
  }): Promise<UserDO> {
    params = Object.assign({status: 1}, params)

    const result = await this.exe<any>(
      'apaas_user:queryById',
      params
    )

    return result && result.length > 0 ? result[0] : void 0
  }

  @Mapping(UserDO)
  public async queryByIds(params: {
    ids: string[]
  }): Promise<UserDO> {
    params = Object.assign({status: 1}, params)

    const result = await this.exe<any>(
      'apaas_user:queryByIds',
      params
    )

    return result
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

  @Mapping(UserDO)
  public async queryByIds(params: { ids: number[] }): Promise<UserDO> {
    params = Object.assign({status: 1}, params)

    const result = await this.exe<any>(
      'apaas_user:queryByIds',
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
    name?: string
    password?: string
    avatar?: string
    mobilePhone?: number
    role?: number
  }): Promise<any> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user:insert',
      Object.assign(
        params,
        {
          id: genMainIndexOfDB(),
          createTime: new Date().getTime(),
          updateTime: new Date().getTime(),
          status: 1,
          avatar: params?.avatar ?? "/default_avatar.png",
          role: params.role ?? 1
        }
      )
    )

    return {id: result.insertId}
  }

  @Mapping(UserDO)
  public async getGroupOwnerInfo(query: {
    groupId: number
  }): Promise<any> {
    const result = await this.exe<any>(
      'apaas_user:getGroupOwnerInfo',
      query
    )

    return result && result[0]
  }
}