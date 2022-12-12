import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import FileDao from "../dao/FileDao";

@Controller("api")
export default class ConfigService {
  fileDao: FileDao;

  constructor() {
    this.fileDao = new FileDao();
  }

  @Get("/file/get")
  async getAll(@Query() query) {
    const { id, extName, page, pageSize = 10, parentId, creatorId } = query ?? {}
    const files = await this.fileDao.query({
      id,
      extName,
      page,
      pageSize,
      parentId,
      creatorId
    })
    return {
      code: 1,
      data: files,
    };
  }

  @Get("/file/getSysTemFiles")
  async getSysTemFiles(@Query() query) {
    const { extName, name, creatorId } = query ?? {}
    const files = await this.fileDao.getFiles({
      type: 'system',
      extName,
      name,
      creatorId
    })
    return {
      code: 1,
      data: files,
    };
  }
}
