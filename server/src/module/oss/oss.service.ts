import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import * as OSS from 'ali-oss';
import ConfigDao from './../../dao/config.dao'

interface OssConfig {
  [key: string]: string
}

@Injectable()
export default class OssService {
  configDao: ConfigDao;

  constructor() {
    this.configDao = new ConfigDao();
  }

  async getOssConfig():Promise<OssConfig> {
    const configList = await this.configDao.getConfig({
      namespace: ['mybricks-oss-config'],
    });

    return configList?.[0]?.config as any as OssConfig
  }

  async saveFile(file, ossConfig:OssConfig = {}) {
    const { cdnDomain, ...config } = ossConfig

    const client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
    });

    try {
      let filePath = ''
      file?.path?.split('/').forEach(path => {
        filePath += `${path}/`
      })
      const result = await client.put(filePath + file.name, Buffer.from(file.buffer));
  
      if (result.res.status === 200) {
        return { name: result.name, url: result.url };
      } else {
        throw new Error('上传 OSS 失败!')
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
