import { Injectable } from '@nestjs/common';
import { BaseAdapter } from './base.adapter';
import {
  IChatCompletionRequest,
  IChatCompletionResponse,
  IMessage,
  MessageRole,
} from '../types';

/**
 * Google AI (Gemini) 适配器
 */
@Injectable()
export class GoogleAdapter extends BaseAdapter {
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
    } = request;

    // 转换消息格式
    const convertedMessages = this.convertGoogleMessages(messages);

    const requestBody: any = {
      model,
      contents: convertedMessages.contents,
      generationConfig: {},
    };

    // 系统指令
    if (
      convertedMessages.systemInstruction &&
      convertedMessages.systemInstruction.parts.length > 0
    ) {
      requestBody.systemInstruction = convertedMessages.systemInstruction;
    }

    // 生成配置
    const config = requestBody.generationConfig;
    if (temperature !== undefined) config.temperature = temperature;
    if (top_p !== undefined) config.topP = top_p;
    if (top_k !== undefined) config.topK = top_k;
    if (max_tokens !== undefined) config.maxOutputTokens = max_tokens;

    // 停止序列（最多5个，1-16字符）
    if (stop) {
      const stopArray = this.handleStopSequences(stop, 5);
      if (stopArray) {
        config.stopSequences = stopArray.filter(
          (s) => s.length >= 1 && s.length <= 16,
        );
      }
    }

    // 安全设置（默认关闭所有限制）
    requestBody.safetySettings = [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ];

    return this.cleanEmptyParams(requestBody);
  }

  /**
   * 适配响应数据
   */
  adaptResponse(response: any): IChatCompletionResponse {
    const candidate = response.candidates?.[0];
    const content = candidate?.content;
    const text = content?.parts?.[0]?.text || '';

    return {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.modelVersion || 'gemini',
      choices: [
        {
          index: 0,
          message: {
            role: MessageRole.ASSISTANT,
            content: text,
          },
          finish_reason: this.convertFinishReason(candidate?.finishReason),
        },
      ],
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  /**
   * 适配流式响应
   */
  adaptStreamChunk(chunk: any): any {
    const candidate = chunk.candidates?.[0];
    const content = candidate?.content;
    const text = content?.parts?.[0]?.text || '';

    return {
      id: 'chatcmpl-stream-' + Date.now(),
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'gemini',
      choices: [
        {
          index: 0,
          delta: {
            content: text,
          },
          finish_reason: this.convertFinishReason(candidate?.finishReason),
        },
      ],
    };
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
      'stop',
      'stream',
    ];
  }

  /**
   * 转换消息为 Google 格式
   */
  private convertGoogleMessages(messages: IMessage[]): {
    systemInstruction: any;
    contents: any[];
  } {
    const systemInstruction = {
      parts: [] as any[],
    };
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === MessageRole.SYSTEM) {
        systemInstruction.parts.push({
          text: typeof msg.content === 'string' ? msg.content : '',
        });
      } else {
        contents.push({
          role: msg.role === MessageRole.ASSISTANT ? 'model' : 'user',
          parts: [
            {
              text:
                typeof msg.content === 'string'
                  ? msg.content
                  : JSON.stringify(msg.content),
            },
          ],
        });
      }
    }

    return { systemInstruction, contents };
  }

  /**
   * 转换结束原因
   */
  private convertFinishReason(
    reason: string | undefined,
  ): 'stop' | 'length' | 'content_filter' {
    const mapping: Record<
      string,
      'stop' | 'length' | 'content_filter' | 'tool_calls'
    > = {
      STOP: 'stop',
      MAX_TOKENS: 'length',
      SAFETY: 'content_filter',
      RECITATION: 'content_filter',
      OTHER: 'stop',
    };
    return (mapping[reason || 'STOP'] as any) || 'stop';
  }
}
