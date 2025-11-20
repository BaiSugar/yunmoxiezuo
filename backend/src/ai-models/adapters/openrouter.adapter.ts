import { Injectable } from '@nestjs/common';
import { BaseAdapter } from './base.adapter';
import { IChatCompletionRequest, IChatCompletionResponse } from '../types';

/**
 * OpenRouter 适配器
 */
@Injectable()
export class OpenRouterAdapter extends BaseAdapter {
  /**
   * 适配请求参数
   */
  adaptRequest(request: IChatCompletionRequest): any {
    const {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      top_k,
      top_a,
      min_p,
      frequency_penalty,
      presence_penalty,
      repetition_penalty,
      stop,
      stream,
      seed,
      tools,
      tool_choice,
      response_format,
    } = request;

    const requestBody: any = {
      model,
      messages,
      stream: stream || false,
    };

    // 标准参数
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (max_tokens !== undefined) requestBody.max_tokens = max_tokens;
    if (top_p !== undefined) requestBody.top_p = top_p;
    if (frequency_penalty !== undefined)
      requestBody.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined)
      requestBody.presence_penalty = presence_penalty;

    // OpenRouter 扩展参数
    if (top_k !== undefined) requestBody.top_k = top_k;
    if (top_a !== undefined) requestBody.top_a = top_a;
    if (min_p !== undefined) requestBody.min_p = min_p;
    if (repetition_penalty !== undefined)
      requestBody.repetition_penalty = repetition_penalty;

    // 停止序列
    if (stop) requestBody.stop = stop;

    // 随机种子
    if (seed !== undefined && seed !== -1) requestBody.seed = seed;

    // 工具调用
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = tool_choice || 'auto';
    }

    // 结构化输出
    if (response_format) {
      requestBody.response_format = response_format;
    }

    // OpenRouter 特定参数
    if (request['transforms']) {
      requestBody.transforms = request['transforms'];
    }

    if (request['route']) {
      requestBody.route = request['route'];
    }

    if (request['provider']) {
      requestBody.provider = request['provider'];
    }

    if (request['include_reasoning']) {
      requestBody.include_reasoning = request['include_reasoning'];
    }

    return this.cleanEmptyParams(requestBody);
  }

  /**
   * 适配响应数据（OpenRouter 返回标准 OpenAI 格式）
   */
  adaptResponse(response: any): IChatCompletionResponse {
    return response;
  }

  /**
   * 适配流式响应
   */
  adaptStreamChunk(chunk: any): any {
    return chunk;
  }

  /**
   * 获取支持的参数列表
   */
  getSupportedParameters(): string[] {
    return [
      'model',
      'messages',
      'temperature',
      'max_tokens',
      'top_p',
      'top_k',
      'top_a',
      'min_p',
      'frequency_penalty',
      'presence_penalty',
      'repetition_penalty',
      'stop',
      'stream',
      'seed',
      'tools',
      'tool_choice',
      'response_format',
      'transforms',
      'route',
      'provider',
      'include_reasoning',
    ];
  }
}
