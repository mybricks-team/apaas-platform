import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import AppService from '../module/app/app.service';
const env = require('../../env.js')

@Controller()
export default class HomeService {
  appService: AppService;

  constructor() {
    this.appService = new AppService()
  }

  @Get('/')
  async getInstalledList(@Req() req, @Res() res) {
    const apps: any = await this.appService.getAllInstalledList({ filterSystemApp: false })
    let filePath =  path.join(process.cwd(), `./_assets/workspace.html`);
    apps?.forEach(app => {
      if(app.namespace === 'mybricks-app-login' || app.namespace === 'mybricks-hainiu-login') {
        filePath = path.join(env.APPS_BASE_FOLDER, `./${app.namespace}/assets/login.html`);
      }
    });
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.send(`未配置首页请前往: ${req.hostname}/workspace.html`);
    }
  }
}
