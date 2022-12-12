import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import ConfigService from "./config";

@Controller()
export default class HomeService {
  configService: ConfigService;

  constructor() {
    this.configService = new ConfigService()
  }

  @Get("/")
  async getInstalledList(@Req() req, @Res() res) {
    const config = await this.configService.getAll(['system'])
    const platformHome = config?.data?.system?.config?.platformHome || 'about.html';
    const filePath = path.join(process.cwd(), `./_assets/${platformHome}`)
    if(fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.send(`未配置首页请前往: ${req.hostname}/workspace.html`);
    }
  }
}
