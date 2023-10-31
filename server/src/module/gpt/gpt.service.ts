import {Injectable} from '@nestjs/common';
import { Response } from 'express';
import * as axios from 'axios';
import GPTLogDao from "../../dao/GPTLogDao";
const crypto = require('crypto');


function genAuthorization(params) {
  const {
    AccessKeyId,
    AccessKeySecret,
    VERB,
    ContentMd5,
    ContentType,
    date,
    CanonicalizedOpenSearchHeaders,
    CanonicalizedResource,
  } = params;
  const str = `${VERB}\n${ContentMd5}\n${ContentType}\n${date}\n${CanonicalizedOpenSearchHeaders}\n${CanonicalizedResource}`;
  const hmac = crypto.createHmac('sha1', AccessKeySecret);
  hmac.update(str);
  const signature = hmac.digest('base64');

  return `OPENSEARCH ${AccessKeyId}:${signature}`;
}

@Injectable()
export default class GPTService {
  gptDao: GPTLogDao

  constructor() {
    this.gptDao = new GPTLogDao();
  }

  async knowledgeSearch(body, response: Response) {
    const AccessKeyId = process.env.ALI_GPT_ACCESS_KEY_ID;
    const AccessKeySecret = process.env.ALI_GPT_ACCESS_KEY_SECRET;
    const VERB = 'POST';
    const ContentMd5 = '';
    const ContentType = 'application/json';
    const date = new Date().toISOString().slice(0, -5) + 'Z';
    const CanonicalizedOpenSearchHeaders = 'x-opensearch-nonce:mybricks';
    const CanonicalizedResource = '/v3/openapi/apps/mybricks_docs_copilot/actions/knowledge-search';

    const Authorization = genAuthorization({
      AccessKeyId,
      AccessKeySecret,
      VERB,
      ContentMd5,
      ContentType,
      date,
      CanonicalizedOpenSearchHeaders,
      CanonicalizedResource,
    });

    // @ts-ignore
    axios({
      url: 'https://opensearch-cn-shanghai.aliyuncs.com/v3/openapi/apps/mybricks_docs_copilot/actions/knowledge-search',
      method: VERB,
      headers: {
        'Content-Md5': ContentMd5,
        'Content-Type': ContentType,
        Date: date,
        'x-opensearch-nonce': 'mybricks',
        Authorization: Authorization,
      },
      responseType: 'stream',
      data: body,
    })
      .then((result) => {
        let lastChunk = '';
        result.data.on('data', chunk => {
          const chunkString = chunk.toString().trim();

          if (chunkString && chunkString !== 'data:[done]') {
            response.write(chunkString + '\n\n\n');
            lastChunk = chunkString.replace(/^data:/, '');
          }
        });

        result.data.on('end', async () => {
          const { id } = await this.gptDao.create({
            session: body.question?.session || '',
            userName: body.userName,
            question: body.question?.text || '',
            answer: lastChunk,
            judge: null,
            suggestedAnswer: '',
          });
          response.write(`id:${id}\n\n\n`);
          // 数据接收完成的逻辑
          response.end();
        });
      })
      .catch((err) => {
        console.log('err', err.message);
        response.end();
      });
  }

  async knowledgeJudge(body) {
    await this.gptDao.update({
      id: body.id,
      suggestedAnswer: body.suggestedAnswer || '',
      judge: body.judge ?? null,
    });
  }
}
