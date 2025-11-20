import { Injectable } from '@nestjs/common';
import { BaseAdapter } from './base.adapter';
import {
  IChatCompletionRequest,
  IChatCompletionResponse,
  IMessage,
  MessageRole,
} from '../types';

/**
 * Claude 适配器
 */
@Injectable()
export class ClaudeAdapter extends BaseAdapter {
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
      stop,
      stream,
      tools,
      tool_choice,
      thinking,
      enable_web_search,
    } = request;

    // 分离系统提示和用户消息
    const convertedMessages = this.convertClaudeMessages(messages);

    const requestBody: any = {
      model,
      max_tokens: max_tokens || 4096,
      messages: convertedMessages.messages,
      stream: stream || false,
    };

    // 系统提示
    if (convertedMessages.system && convertedMessages.system.length > 0) {
      requestBody.system = convertedMessages.system;
    }

    // 检测是否使用思维模式
    const useThinking = this.shouldUseThinking(model);
    
    if (useThinking && thinking?.type === 'enabled') {
      // 思维模式
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: thinking.budget_tokens || 2048,
      };
      // 思维模式下不支持采样参数
    } else {
      // 普通模式下的采样参数
      const isLimitedSampling = this.isLimitedSamplingModel(model);
      
      if (temperature !== undefined) requestBody.temperature = temperature;
      if (top_p !== undefined) requestBody.top_p = top_p;
      if (top_k !== undefined) requestBody.top_k = top_k;

      // 受限采样模型：temperature 和 top_p 互斥
      if (isLimitedSampling) {
        if (top_p !== undefined && top_p < 1) {
          delete requestBody.temperature;
        } else {
          delete requestBody.top_p;
        }
      }
    }

    // 停止序列
    if (stop) {
      requestBody.stop_sequences = this.handleStopSequences(stop);
    }

    // 工具调用（转换为 Claude 格式）
    if (tools && tools.length > 0) {
      requestBody.tools = tools
        .filter((tool) => tool.type === 'function')
        .map((tool) => ({
          name: tool.function.name,
          description: tool.function.description,
          input_schema: this.flattenSchema(tool.function.parameters),
        }));

      if (tool_choice && typeof tool_choice === 'object') {
        requestBody.tool_choice = {
          type: 'tool',
          name: tool_choice.name,
        };
      } else {
        requestBody.tool_choice = { type: tool_choice || 'auto' };
      }
    }

    // 网络搜索（Claude 3.5+）
    if (enable_web_search) {
      requestBody.enable_web_search = true;
    }

    return this.cleanEmptyParams(requestBody);
  }

  /**
   * 适配响应数据
   */
  adaptResponse(response: any): IChatCompletionResponse {
    const content = response.content?.[0];
    const text = content?.type === 'text' ? content.text : '';

    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: MessageRole.ASSISTANT,
            content: text,
          },
          finish_reason: response.stop_reason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.usage?.input_tokens || 0,
        completion_tokens: response.usage?.output_tokens || 0,
        total_tokens:
          (response.usage?.input_tokens || 0) +
          (response.usage?.output_tokens || 0),
        prompt_cache_hit_tokens: response.usage?.cache_read_input_tokens,
        prompt_cache_miss_tokens: response.usage?.cache_creation_input_tokens,
      },
    };
  }

  /**
   * 适配流式响应
   */
  adaptStreamChunk(chunk: any): any {
    if (chunk.type === 'content_block_delta') {
      return {
        id: chunk.id || 'chatcmpl-stream',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: chunk.model || 'claude',
        choices: [
          {
            index: 0,
            delta: {
              content: chunk.delta?.text || '',
            },
            finish_reason: null,
          },
        ],
      };
    }

    if (chunk.type === 'message_stop') {
      return {
        id: chunk.id || 'chatcmpl-stream',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: chunk.model || 'claude',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
      };
    }

    return null;
  }

  /**
   * 获取支持的参数列表
   */
  getSupportedParameters(): string[] {
    return [
      'model',
      'messages',
      'max_tokens',
      'temperature',
      'top_p',
      'top_k',
      'stop',
      'stream',
      'tools',
      'tool_choice',
      'thinking',
      'enable_web_search',
    ];
  }

  /**
   * 转换消息为 Claude 格式
   */
  private convertClaudeMessages(messages: IMessage[]): {
    system: any[];
    messages: any[];
  } {
    const system: any[] = [];
    const convertedMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === MessageRole.SYSTEM) {
        system.push({
          type: 'text',
          text: typeof msg.content === 'string' ? msg.content : '',
        });
      } else {
        convertedMessages.push({
          role: msg.role,
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        });
      }
    }

    return { system, messages: convertedMessages };
  }

  /**
   * 判断是否应该使用思维模式
   */
  private shouldUseThinking(model: string): boolean {
    return /^claude-(3-7|opus-4|sonnet-4|haiku-4-5)/.test(model);
  }

  /**
   * 判断是否为受限采样模型
   */
  private isLimitedSamplingModel(model: string): boolean {
    return /^claude-(opus-4-1|sonnet-4-5|haiku-4-5)/.test(model);
  }

  /**
   * 扁平化 JSON Schema
   */
  private flattenSchema(schema: any): any {
    // Claude 的 input_schema 格式略有不同
    return schema;
  }
}
