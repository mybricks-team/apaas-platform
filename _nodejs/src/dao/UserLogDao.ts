import * as moment from 'dayjs'
import {Column, DOBase, Mapping} from '@mybricks/rocker-dao'

export class UserLogDO {
  @Column
  id: number

  @Column
  type: string

  @Column('user_id')
  userId: string

  @Column('user_email')
  userEmail: string

  @Column('log_content')
  logContent: string

  @Column('create_time')
  createTime(a) {
    return moment(a).format("YYYY-MM-DD HH:mm:ss")
  }
}

export default class UserLogDao extends DOBase {
  @Mapping(UserLogDO)
  public async queryAllDownload(): Promise<UserLogDO[]> {
    const result = await this.exe<any>(
      'apaas_user_log:queryByType', {type: 1}
    )

    return result
  }

  public async createDownloadLog(params: {
    userId: string,
    userEmail: string
    logContent: string
  }): Promise<number> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user_log:insert',
      Object.assign(
        params,
        {
          type: 1,
          createTime: new Date().getTime()
        }
      )
    )

    return result.insertId
  }

  public async createUpgradeLog(params: {
    userId: string,
    userEmail: string
    logContent: string
  }): Promise<number> {
    params = Object.assign({}, params)

    const result = await this.exe<any>(
      'apaas_user_log:insert',
      Object.assign(
        params,
        {
          type: 2,
          createTime: new Date().getTime()
        }
      )
    )

    return result.insertId
  }
}