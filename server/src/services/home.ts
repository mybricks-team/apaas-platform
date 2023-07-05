import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import AppsService from './apps';
import ConfigService from './config';
const env = require('../../env.js')

@Controller()
export default class HomeService {
  configService: ConfigService;
  appsService: AppsService;

  constructor() {
    this.configService = new ConfigService();
    this.appsService = new AppsService()
  }

  @Get('/')
  async getInstalledList(@Req() req, @Res() res) {
    const config = await this.configService.getAll(['system']);
    const apps: any = await this.appsService.getAllInstalledList({ filterSystemApp: false })
    let filePath =  path.join(process.cwd(), `./_assets/${config?.data?.system?.config?.platformHome || 'workspace.html'}`);
    apps?.forEach(app => {
      if(app.namespace === 'mybricks-app-login') {
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
