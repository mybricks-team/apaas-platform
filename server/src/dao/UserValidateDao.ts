import { genMainIndexOfDB } from '../utils';
import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

/**
 * UserDO
 * @param id         主键
 * @param userId     用户id
 * @param type       验证类型
 * @param captcha    验证码
 * @param createTime 创建时间
 */
export class UserValidateDO {
  @Column
  id: number;

  @Column('user_id')
  userId: string;

  @Column('type')
  type: string;

  @Column('captcha')
  captcha: string;

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss");
  }
}

export default class UserValidateDao extends DOBase {

  public async create(params: { userId: number; type: string; captcha: string }): Promise<any> {
    const result = await this.exe<any>(
      'apaas_user_validate:insert',
      {
        ...params,
        id: genMainIndexOfDB(),
        createTime: Date.now(),
        status: 1
      }
    )

    return { id: result.insertId }
  }

  @Mapping(UserValidateDO)
  public async queryByUserId(params: { type: string; userId: number, timeInterval: number }): Promise<any> {
    return await this.exe<any>(
      'apaas_user_validate:queryByUserId',
      { ...params, currentTime: Date.now() }
    );
  }
}