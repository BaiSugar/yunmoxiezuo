import { Injectable, Logger } from '@nestjs/common';
import {
  PromptComponent,
  PositionBucket,
} from '../interfaces/prompt-component.interface';
import { TokenBudget, TokenStats } from '../interfaces/build-options.interface';

/**
 * Token管理服务
 * 负责估算Token数量和执行预算控制（阶段4）
 */
@Injectable()
export class TokenManagerService {
  private readonly logger = new Logger(TokenManagerService.name);

  /**
   * 估算文本的Token数量（简化版）
   * 实际应该使用 tiktoken 等库进行精确计算
   * @param text 文本内容
   * @returns Token数量估算值
   */
  estimateTokens(text: string): number {
    if (!text) return 0;

    // 简化估算：英文约4字符1token，中文约1.5字符1token
    // 这里使用平均值：约2.5字符1token
    const charCount = text.length;
    const englishChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const chineseChars = charCount - englishChars;

    const englishTokens = englishChars / 4;
    const chineseTokens = chineseChars / 1.5;

    return Math.ceil(englishTokens + chineseTokens);
  }

  /**
   * 为所有组件计算Token数量
   * @param components 组件数组
   * @returns 带Token数量的组件数组
   */
  calculateTokens(components: PromptComponent[]): PromptComponent[] {
    return components.map((component) => ({
      ...component,
      tokens: this.estimateTokens(component.content),
    }));
  }

  /**
   * 应用Token预算控制
   * @param bucket 位置桶
   * @param budget Token预算配置
   * @returns 裁剪后的位置桶和统计信息
   */
  applyBudget(
    bucket: PositionBucket,
    budget: TokenBudget,
  ): { bucket: PositionBucket; stats: TokenStats } {
    // 先计算所有组件的Token
    bucket = this.calculateTokensForBucket(bucket);

    // 计算当前总Token数
    const currentStats = this.calculateStats(bucket, budget);

    this.logger.debug(
      `当前Token总数: ${currentStats.total}, 预算: ${budget.total}`,
    );

    // 如果没有超出预算，直接返回
    if (!currentStats.overBudget) {
      return { bucket, stats: currentStats };
    }

    // 超出预算，需要裁剪
    this.logger.warn(
      `Token超出预算 ${currentStats.total - budget.total}，开始裁剪`,
    );

    let trimmedBucket = { ...bucket };
    let trimmedCount = 0;

    // 1. 首先裁剪世界书（非常驻条目，按order从大到小删除）
    const worldBookBudget = Math.floor(
      budget.total * (budget.worldBookRatio || 0.25),
    );
    const { components: trimmedWorldBook, trimmed: wb_trimmed } =
      this.trimWorldBook(
        [
          ...trimmedBucket.beforeChar,
          ...trimmedBucket.afterChar,
        ],
        worldBookBudget,
      );
    trimmedCount += wb_trimmed;

    // 重新分配世界书组件到beforeChar和afterChar
    trimmedBucket.beforeChar = trimmedWorldBook.filter(
      (c) => c.identifier.startsWith('worldbook') && (c.order ?? 100) < 100,
    );
    trimmedBucket.afterChar = trimmedWorldBook.filter(
      (c) => c.identifier.startsWith('worldbook') && (c.order ?? 100) >= 100,
    );

    // 2. 裁剪历史消息（从旧到新删除，保护最近N条）
    const protectedCount = budget.protectedHistoryCount || 5;
    const { components: trimmedHistory, trimmed: h_trimmed } =
      this.trimHistory(trimmedBucket.history, protectedCount, budget.total);
    trimmedBucket.history = trimmedHistory;
    trimmedCount += h_trimmed;

    // 3. 裁剪示例消息（如果还需要）
    const exampleBudget = budget.examples || 500;
    const { components: trimmedExamples, trimmed: e_trimmed } =
      this.trimExamples(trimmedBucket.examples, exampleBudget);
    trimmedBucket.examples = trimmedExamples;
    trimmedCount += e_trimmed;

    // 重新计算统计信息
    const finalStats = this.calculateStats(trimmedBucket, budget);
    finalStats.trimmedComponents = trimmedCount;

    this.logger.debug(
      `裁剪完成: 移除 ${trimmedCount} 个组件, 最终Token: ${finalStats.total}`,
    );

    return { bucket: trimmedBucket, stats: finalStats };
  }

  /**
   * 为位置桶中的所有组件计算Token
   * @param bucket 位置桶
   * @returns 带Token数量的位置桶
   */
  private calculateTokensForBucket(bucket: PositionBucket): PositionBucket {
    return {
      systemPrompts: this.calculateTokens(bucket.systemPrompts),
      beforeChar: this.calculateTokens(bucket.beforeChar),
      charDef: this.calculateTokens(bucket.charDef),
      afterChar: this.calculateTokens(bucket.afterChar),
      exampleTop: this.calculateTokens(bucket.exampleTop),
      examples: this.calculateTokens(bucket.examples),
      exampleBottom: this.calculateTokens(bucket.exampleBottom),
      history: this.calculateTokens(bucket.history),
      depthInjections: this.calculateTokens(bucket.depthInjections),
      anTop: this.calculateTokens(bucket.anTop),
      anBottom: this.calculateTokens(bucket.anBottom),
      latestInput: this.calculateTokens(bucket.latestInput),
    };
  }

  /**
   * 计算统计信息
   * @param bucket 位置桶
   * @param budget Token预算
   * @returns Token统计
   */
  private calculateStats(
    bucket: PositionBucket,
    budget: TokenBudget,
  ): TokenStats {
    const systemPrompts = this.sumTokens(bucket.systemPrompts);
    const characterDef = this.sumTokens([
      ...bucket.beforeChar,
      ...bucket.charDef,
    ]);
    const examples = this.sumTokens([
      ...bucket.exampleTop,
      ...bucket.examples,
      ...bucket.exampleBottom,
    ]);
    const worldBook = this.sumTokens([
      ...bucket.beforeChar.filter((c) => c.identifier.startsWith('worldbook')),
      ...bucket.afterChar.filter((c) => c.identifier.startsWith('worldbook')),
    ]);
    const history = this.sumTokens(bucket.history);
    const authorNote = this.sumTokens([...bucket.anTop, ...bucket.anBottom]);
    const userInput = this.sumTokens(bucket.latestInput);

    const total =
      systemPrompts +
      characterDef +
      examples +
      worldBook +
      history +
      authorNote +
      userInput;

    return {
      total,
      systemPrompts,
      characterDef,
      examples,
      worldBook,
      history,
      authorNote,
      userInput,
      overBudget: total > budget.total,
      trimmedComponents: 0,
    };
  }

  /**
   * 计算组件数组的总Token数
   * @param components 组件数组
   * @returns 总Token数
   */
  private sumTokens(components: PromptComponent[]): number {
    return components.reduce((sum, c) => sum + (c.tokens || 0), 0);
  }

  /**
   * 裁剪世界书条目
   * @param components 世界书组件
   * @param budget 世界书预算
   * @returns 裁剪后的组件和被裁剪数量
   */
  private trimWorldBook(
    components: PromptComponent[],
    budget: number,
  ): { components: PromptComponent[]; trimmed: number } {
    // 分离常驻和非常驻条目
    const constant = components.filter((c) => c.constant);
    const nonConstant = components
      .filter((c) => !c.constant)
      .sort((a, b) => (a.order || 100) - (b.order || 100)); // order越小优先级越高

    let currentTokens = this.sumTokens(constant);
    const result: PromptComponent[] = [...constant];

    // 从优先级高的开始添加，直到超出预算
    for (const component of nonConstant) {
      if (currentTokens + (component.tokens || 0) <= budget) {
        result.push(component);
        currentTokens += component.tokens || 0;
      }
    }

    const trimmed = components.length - result.length;
    return { components: result, trimmed };
  }

  /**
   * 裁剪历史消息
   * @param components 历史消息组件
   * @param protectedCount 保护的最近消息数量
   * @param totalBudget 总预算
   * @returns 裁剪后的组件和被裁剪数量
   */
  private trimHistory(
    components: PromptComponent[],
    protectedCount: number,
    totalBudget: number,
  ): { components: PromptComponent[]; trimmed: number } {
    if (components.length <= protectedCount) {
      return { components, trimmed: 0 };
    }

    // 保护最近的N条消息
    const protected_messages = components.slice(-protectedCount);
    const trimmable = components.slice(0, -protectedCount);

    // 从最早的消息开始删除
    // 可以根据需要实现更复杂的策略（如优先保留用户消息）
    const result = [...protected_messages];
    const trimmed = trimmable.length;

    return { components: result, trimmed };
  }

  /**
   * 裁剪示例消息
   * @param components 示例消息组件
   * @param budget 示例消息预算
   * @returns 裁剪后的组件和被裁剪数量
   */
  private trimExamples(
    components: PromptComponent[],
    budget: number,
  ): { components: PromptComponent[]; trimmed: number } {
    let currentTokens = 0;
    const result: PromptComponent[] = [];

    for (const component of components) {
      if (currentTokens + (component.tokens || 0) <= budget) {
        result.push(component);
        currentTokens += component.tokens || 0;
      } else {
        break;
      }
    }

    const trimmed = components.length - result.length;
    return { components: result, trimmed };
  }
}
