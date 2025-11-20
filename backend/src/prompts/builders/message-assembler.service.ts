import { Injectable, Logger } from '@nestjs/common';
import {
  PromptComponent,
  PositionBucket,
  Message,
} from '../interfaces/prompt-component.interface';
import { PromptRole } from '../entities/prompt-content.entity';

/**
 * 消息组装服务
 * 负责将位置桶中的组件组装成消息数组（阶段5）
 */
@Injectable()
export class MessageAssemblerService {
  private readonly logger = new Logger(MessageAssemblerService.name);

  /**
   * 组装消息数组
   * @param bucket 位置桶
   * @returns 消息数组
   */
  assembleMessages(bucket: PositionBucket): Message[] {
    const messages: Message[] = [];

    // 1. 系统提示
    messages.push(...this.componentsToMessages(bucket.systemPrompts));

    // 2. 角色定义之前
    messages.push(...this.componentsToMessages(bucket.beforeChar));

    // 3. 角色定义
    messages.push(...this.componentsToMessages(bucket.charDef));

    // 4. 角色定义之后
    messages.push(...this.componentsToMessages(bucket.afterChar));

    // 5. 示例消息之前
    messages.push(...this.componentsToMessages(bucket.exampleTop));

    // 6. 示例消息
    messages.push(...this.componentsToMessages(bucket.examples));

    // 7. 示例消息之后
    messages.push(...this.componentsToMessages(bucket.exampleBottom));

    // 8. 对话历史（含深度注入）
    const historyWithInjections = this.injectDepthComponents(
      bucket.history,
      bucket.depthInjections,
    );
    messages.push(...this.componentsToMessages(historyWithInjections));

    // 9. Author's Note 顶部
    messages.push(...this.componentsToMessages(bucket.anTop));

    // 10. Author's Note 底部
    messages.push(...this.componentsToMessages(bucket.anBottom));

    // 11. 用户最新输入
    messages.push(...this.componentsToMessages(bucket.latestInput));

    this.logger.debug(`组装完成: 共 ${messages.length} 条消息`);

    return messages;
  }

  /**
   * 将组件数组转换为消息数组
   * @param components 组件数组
   * @returns 消息数组
   */
  private componentsToMessages(components: PromptComponent[]): Message[] {
    return components.map((component) => ({
      role: this.mapRole(component.role),
      content: component.content,
    }));
  }

  /**
   * 映射角色类型
   * @param role 提示词角色
   * @returns 消息角色
   */
  private mapRole(role: PromptRole): 'system' | 'user' | 'assistant' {
    switch (role) {
      case PromptRole.SYSTEM:
        return 'system';
      case PromptRole.USER:
        return 'user';
      case PromptRole.ASSISTANT:
        return 'assistant';
      default:
        return 'system';
    }
  }

  /**
   * 将深度注入组件插入到历史消息中
   * @param history 历史消息组件
   * @param depthInjections 深度注入组件
   * @returns 插入后的历史消息组件数组
   */
  private injectDepthComponents(
    history: PromptComponent[],
    depthInjections: PromptComponent[],
  ): PromptComponent[] {
    if (depthInjections.length === 0) {
      return history;
    }

    // 复制历史消息数组
    const result: PromptComponent[] = [...history];
    const historyLength = result.length;

    // 按深度从大到小排序（深度大的先插入，避免索引偏移）
    const sortedInjections = [...depthInjections].sort(
      (a, b) => (b.depth || 0) - (a.depth || 0),
    );

    for (const injection of sortedInjections) {
      const depth = injection.depth || 0;

      // 计算插入位置
      // depth=0: 最新消息之后
      // depth=n: 倒数第n条消息之后
      let insertIndex = historyLength - depth;

      // 确保索引在有效范围内
      if (insertIndex < 0) {
        insertIndex = 0;
      } else if (insertIndex > result.length) {
        insertIndex = result.length;
      }

      // 插入注入组件
      result.splice(insertIndex, 0, injection);

      this.logger.debug(
        `在索引 ${insertIndex} 插入深度注入 (depth=${depth}): ${injection.identifier}`,
      );
    }

    return result;
  }

  /**
   * 合并连续的同角色消息（用于某些API格式要求）
   * @param messages 消息数组
   * @returns 合并后的消息数组
   */
  mergeSameRoleMessages(messages: Message[]): Message[] {
    if (messages.length === 0) {
      return [];
    }

    const merged: Message[] = [];
    let current = { ...messages[0] };

    for (let i = 1; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.role === current.role) {
        // 同角色，合并内容
        current.content += '\n\n' + msg.content;
      } else {
        // 不同角色，保存当前消息，开始新消息
        merged.push(current);
        current = { ...msg };
      }
    }

    // 添加最后一条消息
    merged.push(current);

    this.logger.debug(
      `合并同角色消息: ${messages.length} -> ${merged.length}`,
    );

    return merged;
  }

  /**
   * 确保消息数组以用户消息开始（某些API要求）
   * @param messages 消息数组
   * @returns 调整后的消息数组
   */
  ensureStartsWithUser(messages: Message[]): Message[] {
    if (messages.length === 0) {
      return messages;
    }

    // 如果第一条不是user消息，找到第一条user消息并提前
    const firstUserIndex = messages.findIndex((m) => m.role === 'user');

    if (firstUserIndex === -1) {
      this.logger.warn('消息数组中没有用户消息');
      return messages;
    }

    if (firstUserIndex === 0) {
      return messages;
    }

    // 将第一条user消息之前的所有消息合并为system消息
    const systemMessages = messages.slice(0, firstUserIndex);
    const systemContent = systemMessages
      .map((m) => m.content)
      .join('\n\n');

    const result = [
      { role: 'system' as const, content: systemContent },
      ...messages.slice(firstUserIndex),
    ];

    this.logger.debug('调整消息顺序: 确保以用户消息开始');

    return result;
  }

  /**
   * 确保消息数组符合user/assistant交替模式
   * @param messages 消息数组
   * @returns 调整后的消息数组
   */
  ensureAlternatingPattern(messages: Message[]): Message[] {
    const result: Message[] = [];
    let expectedRole: 'user' | 'assistant' = 'user';

    for (const msg of messages) {
      if (msg.role === 'system') {
        // system消息直接添加
        result.push(msg);
      } else if (msg.role === expectedRole) {
        // 符合预期的角色
        result.push(msg);
        expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
      } else {
        // 不符合预期，合并到上一条消息或创建新消息
        if (result.length > 0 && result[result.length - 1].role === msg.role) {
          // 合并到上一条同角色消息
          result[result.length - 1].content += '\n\n' + msg.content;
        } else {
          // 添加为新消息（可能会打破交替模式，但保留内容）
          result.push(msg);
        }
      }
    }

    this.logger.debug('确保消息交替模式');

    return result;
  }
}
