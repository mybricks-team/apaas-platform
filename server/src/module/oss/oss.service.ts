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

  async saveFile(file, ossConfig:OssConfig) {
    const client = new OSS({
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
    });

    try {
      const result = await client.put(file.path + file.name, Buffer.from(file.buffer));
  
      if (result.res.status === 200) {
        return { path: result.name, url: result.url };
      } else {
        throw new Error('上传 OSS 失败!')
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
