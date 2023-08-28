import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as axios from 'axios';

const CONFIGJSON = {
  weapp: {
    appid: 'wx5da3574458181b8f',
    secret: 'afd66724b7c0695364287aa3b04bd286'
  },
  wxpublic: {
    appid: '',
  }
}

interface PlatformsConfig {
  weapp: {
    appid: string,
    secret: string
  },
  wxpublic: {
    appid: string,
    secret: string
  }
}

@Injectable()
export default class UniService {

  async getPlatformsConfig({ projectId }):Promise<PlatformsConfig> {
    return CONFIGJSON as PlatformsConfig
  }

  async getAccessToken({ projectId }):Promise<string | undefined> {
    const platformsConfig = await this.getPlatformsConfig({ projectId })

    const response = await axios.post(`https://api.weixin.qq.com/cgi-bin/stable_token`, {
      grant_type: 'client_credential',
      ...platformsConfig.weapp
    }, )
    if (response.status === 200) {
      const { access_token, expires_in } = response.data ?? {}
      if (response?.data?.errcode) {
        throw new Error(`${response?.data?.errcode}: ${response?.data?.errmsg}`)
      }
      return access_token
    } else {
      throw new Error(`请求第三方服务器异常`)
    }
  }

  async sendTemplateMessage({ openId, template_id, url = 'main', data, projectId }): Promise<void> {
    const accessToken = await this.getAccessToken({ projectId });
    const response = await axios.post(`https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token=${accessToken}`, {
      touser: openId,
      mp_template_msg: {
        appid: CONFIGJSON.wxpublic.appid,
        template_id,
        miniprogram: {
          appid: CONFIGJSON.weapp.appid,
          pagepath: url
        },
        data
      }
    })

    if (response.status !== 200) {
      throw new Error(`请求第三方服务器异常`)
    }
    if (response?.data?.errcode) {
      throw new Error(`${response?.data?.errcode}: ${response?.data?.errmsg}`)
    }
    return
  }

  async sendSubscribeMessage({ openId, template_id,  url = 'main', data, projectId }): Promise<void> {
    const accessToken = await this.getAccessToken({ projectId });
    const response = await axios.post(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`, {
      touser: openId,
      template_id,
      page: url,
      data,
      miniprogram_state: 'formal',
      lang: 'zh_CN'
    })

    if (response.status !== 200) {
      throw new Error(`请求第三方服务器异常`)
    }
    if (response?.data?.errcode) {
      throw new Error(`${response?.data?.errcode}: ${response?.data?.errmsg}`)
    }
    return
  }
}