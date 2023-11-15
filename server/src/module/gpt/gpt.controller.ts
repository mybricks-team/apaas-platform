import {Body, Controller, Get, Post, Query, Res} from '@nestjs/common';
import { Response } from 'express';
import GPTService from './gpt.service';


@Controller('/paas/api/gpt')
export default class GPTController {
  gptService: GPTService;

  constructor() {
    this.gptService = new GPTService();
  }

  @Post('/knowledge-search')
  async knowledgeSearch(@Body() body: Record<string, unknown>, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    this.gptService.knowledgeSearch(body, res);
  }

  @Post('/knowledge-judge')
  async knowledgeJudge(@Body() body: Record<string, unknown>) {
    try {
      await this.gptService.knowledgeJudge(body);

      return { code: 1, data: null, msg: '评价成功' };
    } catch (e) {
      return { code: -1, msg: e.message || '评价失败' };
    }
  }

  @Post('/knowledge-push')
  async knowledgePush(@Body() body: Record<string, unknown>) {
    try {
      await this.gptService.knowledgePush(body);

      return { code: 1, data: null, msg: '文档推送成功' };
    } catch (e) {
      return { code: -1, msg: e.message || '文档推送失败' };
    }
  }

  @Get('/knowledge-category')
  async getKnowledgeCategory() {
    return {
      code: 1,
      data: await this.gptService.getKnowledgeCategory(),
    }
  }

  @Get('/knowledge-docs')
  async getKnowledgeByCategory(@Query() query) {
    return {
      code: 1,
      data: query.category ? await this.gptService.getKnowledgeByCategory(query) : [],
    }
  }
}