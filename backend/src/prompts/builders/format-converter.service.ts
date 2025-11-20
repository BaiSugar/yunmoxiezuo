import { Injectable, Logger } from '@nestjs/common';
import { Message } from '../interfaces/prompt-component.interface';
import { ApiFormat } from '../enums/api-format.enum';
import { MessageAssemblerService } from './message-assembler.service';

/**
 * 格式转换服务
 * 负责将标准消息数组转换为不同API格式（阶段6）
 */
@Injectable()
export class FormatConverterService {
  private readonly logger = new Logger(FormatConverterService.name);

  constructor(private readonly assembler: MessageAssemblerService) {}

  /**
   * 转换为指定API格式
   * @param messages 标准消息数组
   * @param format API格式
   * @returns 转换后的格式
   */
  convert(messages: Message[], format: ApiFormat): any {
    switch (format) {
      case ApiFormat.OPENAI:
        return this.toOpenAI(messages);

      case ApiFormat.CLAUDE:
        return this.toClaude(messages);

      case ApiFormat.GEMINI:
        return this.toGemini(messages);

      default:
        this.logger.warn(`未知格式 ${format}，使用 OpenAI 格式`);
        return this.toOpenAI(messages);
    }
  }

  /**
   * 转换为 OpenAI 格式（标准格式）
   * @param messages 消息数组
   * @returns OpenAI格式
   */
  private toOpenAI(messages: Message[]): { messages: Message[] } {
    this.logger.debug('转换为 OpenAI 格式');
    return { messages };
  }

  /**
   * 转换为 Claude 格式
   * Claude API要求：
   * 1. system消息需要单独提取
   * 2. messages必须是user/assistant交替
   * 3. 必须以user消息开始
   *
   * @param messages 消息数组
   * @returns Claude格式
   */
  private toClaude(messages: Message[]): {
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    this.logger.debug('转换为 Claude 格式');

    // 1. 提取所有system消息
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    // 2. 合并system消息内容
    const systemContent = systemMessages
      .map((m) => m.content)
      .join('\n\n');

    // 3. 确保消息以user开始
    let claudeMessages = this.assembler.ensureStartsWithUser(nonSystemMessages);

    // 4. 合并连续的同角色消息
    claudeMessages = this.assembler.mergeSameRoleMessages(claudeMessages);

    // 5. 确保交替模式
    claudeMessages = this.assembler.ensureAlternatingPattern(claudeMessages);

    // 6. 过滤掉可能残留的system消息
    const finalMessages = claudeMessages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    return {
      system: systemContent,
      messages: finalMessages,
    };
  }

  /**
   * 转换为 Gemini 格式
   * Gemini API要求：
   * 1. system消息提取为systemInstruction
   * 2. assistant角色改为model
   * 3. content字段改为parts数组
   *
   * @param messages 消息数组
   * @returns Gemini格式
   */
  private toGemini(messages: Message[]): {
    systemInstruction?: { parts: Array<{ text: string }> };
    contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string }>;
    }>;
  } {
    this.logger.debug('转换为 Gemini 格式');

    // 1. 提取所有system消息
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    // 2. 构建systemInstruction
    let systemInstruction: { parts: Array<{ text: string }> } | undefined;

    if (systemMessages.length > 0) {
      const systemContent = systemMessages
        .map((m) => m.content)
        .join('\n\n');

      systemInstruction = {
        parts: [{ text: systemContent }],
      };
    }

    // 3. 转换消息数组
    const contents = nonSystemMessages.map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }],
    }));

    return {
      systemInstruction,
      contents,
    };
  }

  /**
   * 获取格式化后的摘要（用于调试）
   * @param result 格式化结果
   * @param format API格式
   * @returns 摘要字符串
   */
  getSummary(result: any, format: ApiFormat): string {
    switch (format) {
      case ApiFormat.OPENAI:
        return `OpenAI格式: ${result.messages?.length || 0} 条消息`;

      case ApiFormat.CLAUDE:
        return `Claude格式: system长度=${result.system?.length || 0}, ${result.messages?.length || 0} 条消息`;

      case ApiFormat.GEMINI:
        return `Gemini格式: systemInstruction=${!!result.systemInstruction}, ${result.contents?.length || 0} 条内容`;

      default:
        return '未知格式';
    }
  }
}
