import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as axios from 'axios';
const crypto = require('crypto');
import GPTLogDao from '../../dao/GPTLogDao';
import { genMainIndexOfDB } from '../../utils';

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

const VERB = 'POST';
const getAuthHeaders = (params) => {
  const AccessKeyId = process.env.ALI_GPT_ACCESS_KEY_ID;
  const AccessKeySecret = process.env.ALI_GPT_ACCESS_KEY_SECRET;
  const ContentMd5 = '';
  const ContentType = 'application/json';
  const date = new Date().toISOString().slice(0, -5) + 'Z';
  const CanonicalizedOpenSearchHeaders = 'x-opensearch-nonce:mybricks';

  const Authorization = genAuthorization({
    AccessKeyId,
    AccessKeySecret,
    VERB,
    ContentMd5,
    ContentType,
    date,
    CanonicalizedOpenSearchHeaders,
    CanonicalizedResource: params.resource,
  });

  return {
    'Content-Md5': ContentMd5,
    'Content-Type': ContentType,
    Date: date,
    'x-opensearch-nonce': 'mybricks',
    Authorization: Authorization,
  };
};

@Injectable()
export default class GPTService {
  gptDao: GPTLogDao

  constructor() {
    this.gptDao = new GPTLogDao();
  }

  async knowledgeSearch(body, response: Response) {
    // @ts-ignore
    axios({
      url: 'https://opensearch-cn-shanghai.aliyuncs.com/v3/openapi/apps/mybricks_docs_copilot/actions/knowledge-search',
      method: VERB,
      headers: getAuthHeaders({ resource: '/v3/openapi/apps/mybricks_docs_copilot/actions/knowledge-search' }),
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

  async knowledgePush(body) {
    body.docs.forEach(item => {
      item.fields.id = genMainIndexOfDB();
      item.fields.timestamp = Date.now();
      item.fields.score = item.fields.score || 0.5;
    });
    // @ts-ignore
    const res = await axios({
      url: 'https://opensearch-cn-shanghai.aliyuncs.com/v3/openapi/apps/mybricks_docs_copilot/actions/knowledge-bulk',
      method: VERB,
      headers: getAuthHeaders({resource: '/v3/openapi/apps/mybricks_docs_copilot/actions/knowledge-bulk'}),
      data: body.docs,
    });

    if (res.data?.status !== 'OK') {
      throw Error('文档推送失败');
    }
  }
}
