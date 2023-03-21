import { Body, Controller, Get, Res, Post, Query } from "@nestjs/common";
import { Response } from "express";
import FileDao from "../dao/FileDao";
import FileContentDao, { FileContentDO } from "../dao/FileContentDao";

@Controller("/paas/api")
export default class GroundService {
  fileDao: FileDao;

  fileContentDao: FileContentDao;

  constructor() {
    this.fileDao = new FileDao();
    this.fileContentDao = new FileContentDao();
  }

  @Get("/ground/getAll")
  async getAll(@Query() query) {
    const { userId } = query;
    try {
      const rtn = await this.fileDao.query({ shareType: 1 });

      return {
        code: 1,
        data: rtn.filter((item) => {
          if (item.hasIcon === "1") {
            item.icon = `/api/workspace/getFileIcon?fileId=${item.id}`;
          }

          return item.extName !== "component";
        }),
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  @Get("/ground/getFileIcon")
  async getFileIcon(@Query() query, @Res() res: Response) {
    try {
      const file = await this.fileDao.queryIconById(query.fileId);
      const base64 = file.icon.replace(/^data:image\/\w+;base64,/, "");
      const dataBuffer = new Buffer(base64, "base64");

      res.end(dataBuffer);
    } catch (ex) {
      res.end(ex.message);
    }
  }
}
