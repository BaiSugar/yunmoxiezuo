import { Injectable } from '@nestjs/common';
import { BaseAdapter } from './base.adapter';
import {
  IChatCompletionRequest,
  IChatCompletionResponse,
  IStreamChunk,
} from '../types';

/**
 * OpenAI 适配器
 */
@Injectable()
export class OpenAIAdapter extends BaseAdapter {
  /**
   * 适配请求参数（OpenAI 是标准格式，基本不需要转换）
   */
  adaptRequest(request: IChatCompletionRequest): any {
    const {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
      stream,
      seed,
      n,
      logit_bias,
      logprobs,
      top_logprobs,
      tools,
      tool_choice,
      response_format,
      reasoning_effort,
    } = request;

    const requestBody: any = {
      model,
      messages,
      stream: stream || false,
    };

    // 采样参数
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (max_tokens !== undefined) requestBody.max_tokens = max_tokens;
    if (top_p !== undefined) requestBody.top_p = top_p;

    // 重复控制
    if (frequency_penalty !== undefined)
      requestBody.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined)
      requestBody.presence_penalty = presence_penalty;

    // 停止序列
    if (stop) requestBody.stop = stop;

    // 随机性
    if (seed !== undefined && seed !== -1) requestBody.seed = seed;

    // 多样性
    if (n !== undefined && n > 1) requestBody.n = n;

    // Logit 控制
    if (logit_bias && Object.keys(logit_bias).length > 0) {
      requestBody.logit_bias = logit_bias;
    }
    if (logprobs) requestBody.logprobs = logprobs;
    if (top_logprobs !== undefined) requestBody.top_logprobs = top_logprobs;

    // 工具调用
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = tool_choice || 'auto';
    }

    // 结构化输出
    if (response_format) {
      requestBody.response_format = response_format;
    }

    // o1 系列推理
    if (reasoning_effort) {
      requestBody.reasoning_effort = reasoning_effort;
    }

    // 移除 Vision 模型不支持的参数
    if (this.isVisionModel(model)) {
      delete requestBody.logit_bias;
      delete requestBody.logprobs;
      delete requestBody.top_logprobs;
      delete requestBody.stop;
    }

    return this.cleanEmptyParams(requestBody);
  }

  /**
   * 适配响应数据（OpenAI 格式是标准格式，直接返回）
   */
  adaptResponse(response: any): IChatCompletionResponse {
    return response;
  }

  /**
   * 适配流式响应
   */
  adaptStreamChunk(chunk: any): IStreamChunk {
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
      'frequency_penalty',
      'presence_penalty',
      'stop',
      'stream',
      'seed',
      'n',
      'logit_bias',
      'logprobs',
      'top_logprobs',
      'tools',
      'tool_choice',
      'response_format',
      'reasoning_effort',
    ];
  }

  /**
   * 判断是否为 Vision 模型
   */
  private isVisionModel(model: string): boolean {
    return model.includes('gpt') && model.includes('vision');
  }
}
