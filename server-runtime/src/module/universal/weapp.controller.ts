import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Param,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {} from 'querystring';
import { FileInterceptor } from '@nestjs/platform-express';
const env = require('../../../env.js');
import { getRealDomain } from '../../utils/index';
import UniService from './universal.service';
import WeappService from './weapp.service';
import ErrHandlerInterceptor from './interceptors/err-handler';
import { uuid } from '../../utils/index';
import * as path from 'path';
import axios from 'axios';

@Controller('/runtime/api/uni/weapp')
@UseInterceptors(ErrHandlerInterceptor)
export default class UniController {
  uniService: UniService;
  weappService: WeappService;

  constructor() {
    this.uniService = new UniService();
    this.weappService = new WeappService();
  }

  @Post('/message/template/send')
  async sendTemplate(
    @Body('openId') openId: string,
    @Body('templateId') templateId: string,
    @Body('projectId') projectId: string,
  ) {
    await this.weappService.sendTemplateMessage({
      projectId,
      openId,
      template_id: '',
      data: {},
    });

    try {
      return {
        data: {
          url: ``,
        },
        code: 1,
      };
    } catch (err) {
      return {
        code: -1,
        msg: `上传失败: ${err}`,
      };
    }
  }

  @Post('/message/subscribe/send')
  async sendSubscribeMessage(
    @Body('openId') openId: string,
    @Body('templateId') templateId: string,
    @Body('projectId') projectId: string,
  ) {
    await this.weappService.sendSubscribeMessage({
      projectId,
      openId: 'odlHh5I2a78_rAmPrXME1XXLmmpg',
      template_id: 'ZGk-v7GXEkRaRTpnA_8DK-H_EjBRMROX9Vj3MQ5RiDA',
      data: {
        phrase1: {
          value: '审核通过',
        },
        thing2: {
          value: '测试活动',
        },
        date3: {
          value: '2023-08-15',
        },
        thing4: {
          value: '杭州市西湖区西溪谷互联网金融小镇',
        },
        thing5: {
          value: '通过审核，点击查看报名详情',
        },
      },
    });

    try {
      return {
        data: {
          url: ``,
        },
        code: 1,
      };
    } catch (err) {
      return {
        code: -1,
        msg: `上传失败: ${err}`,
      };
    }
  }
}
