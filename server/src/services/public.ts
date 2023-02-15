import { Body, Controller, Get, Post, Query } from "@nestjs/common";

@Controller("")
export default class Service {

  constructor() {}

  @Get("/1684173279.txt")
  async getAll() {
    return "80a253e75d9dcf4c3e283388daaf5099";
  }
}
