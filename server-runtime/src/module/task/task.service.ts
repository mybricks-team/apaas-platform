import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
const { getConnection } = require("@mybricks/rocker-dao");


@Injectable()
export default class TaskService {
  @Cron(CronExpression.EVERY_5_SECONDS)
  async activateConnection() {
    try {
      const con = await getConnection()
      con.query({
        sql: 'select * from apaas_file where id = 1',
        timeout: 10 * 1000,
      }, {}, function (error, results) {
        if (error) {
          return
        }
        console.log(results)
      })
    } catch (err) {
      console.log('activateConnection: ' + err.message)
    }
  }
}