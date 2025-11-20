import { Injectable } from '@nestjs/common';
import { ChatCompletionSource } from '../types';
import { BaseAdapter } from './base.adapter';
import { OpenAIAdapter } from './openai.adapter';
import { ClaudeAdapter } from './claude.adapter';
import { GoogleAdapter } from './google.adapter';
import { OpenRouterAdapter } from './openrouter.adapter';

/**
 * 适配器工厂
 * 根据提供商类型返回对应的适配器实例
 */
@Injectable()
export class AdapterFactory {
  constructor(
    private readonly openaiAdapter: OpenAIAdapter,
    private readonly claudeAdapter: ClaudeAdapter,
    private readonly googleAdapter: GoogleAdapter,
    private readonly openrouterAdapter: OpenRouterAdapter,
  ) {}

  /**
   * 获取适配器
   */
  getAdapter(source: ChatCompletionSource): BaseAdapter {
    switch (source) {
      case ChatCompletionSource.OPENAI:
      case ChatCompletionSource.AZURE_OPENAI:
      case ChatCompletionSource.CUSTOM:
      case ChatCompletionSource.GROQ:
      case ChatCompletionSource.DEEPSEEK:
      case ChatCompletionSource.XAI:
      case ChatCompletionSource.PERPLEXITY:
      case ChatCompletionSource.MISTRALAI:
      case ChatCompletionSource.COHERE:
        // 这些提供商都使用 OpenAI 兼容格式或类似格式
        return this.openaiAdapter;

      case ChatCompletionSource.CLAUDE:
        return this.claudeAdapter;

      case ChatCompletionSource.MAKERSUITE:
      case ChatCompletionSource.VERTEXAI:
        return this.googleAdapter;

      case ChatCompletionSource.OPENROUTER:
        return this.openrouterAdapter;

      default:
        // 默认使用 OpenAI 适配器（最通用）
        return this.openaiAdapter;
    }
  }
}
