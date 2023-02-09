import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateCompletionRequest, OpenAIApi, Configuration } from "openai";

const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

enum ChatScene {
  SQL = 'SQL'
}

@Controller("/paas/api")
export default class AIService {

  @Post("intelligence/chat")
  async chat(@Body() body: any) {
    const { scene, params, prompt } = body ?? {};

    let config: CreateCompletionRequest = {
      model: "text-davinci-003",
      temperature: 0,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: ['#', ';', '。'],
      ...(params ?? {}),
      prompt,
    }

    switch (true) {
      case scene === ChatScene.SQL: {
        config = {
          ...config,
          model: "text-davinci-003",
          temperature: 0,
          max_tokens: 1000,
          stop: ['#', ';', '。'],
        }
        break;
      }

      default: {
        break;
      }
    }

    try {
      const response = await openai.createCompletion(config);
      if (response?.data?.choices?.[0]?.text) {
        return {
          code: 1,
          data: response?.data?.choices?.[0]?.text,
        };
      }
      throw new Error(response?.data?.error || '请求失败');
    } catch (err) {
      return {
        code: 0,
        message: err?.response?.data?.error?.message || err.message || '未知错误',
      };
    }
  }
}
