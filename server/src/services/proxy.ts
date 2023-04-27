import { Body, Controller, Req, Post, Query } from "@nestjs/common";
import * as axios from "axios";

@Controller("/paas/api")
export default class ConfigService {

  @Post("/proxy")
  async proxy(@Req() req) {
    try {
      // @ts-ignore
      const res = await axios(req.body)
      return res.data
    } catch (e) {
      return {
        code: -1,
        msg: e.message,
      };
    }
  }
}
