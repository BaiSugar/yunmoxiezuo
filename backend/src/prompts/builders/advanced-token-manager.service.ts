import { Injectable, Logger } from '@nestjs/common';
import {
  PromptComponent,
  PositionBucket,
} from '../interfaces/prompt-component.interface';
import { TokenBudget, TokenStats } from '../interfaces/build-options.interface';

/**
 * 高级Token管理服务
 * 实现完整的Token预算管理系统，基于SillyTavern的设计
 */
@Injectable()
export class AdvancedTokenManagerService {
  private readonly logger = new Logger(AdvancedTokenManagerService.name);

  // Token计算缓存（LRU缓存）
  private tokenCache = new Map<string, number>();
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * 快速估算Token数（推荐）
   * 与SillyTavern保持一致的估算方式
   * 
   * 优点：
   * ✅ 与SillyTavern一致
   * ✅ 计算极快
   * ✅ 混合文本误差小（±10%）
   * 
   * @param text 文本内容
   * @returns Token数量估算值
   */
  estimateTokens(text: string): number {
    if (!text) return 0;

    // 检查缓存
    const cacheKey = this.getCacheKey(text);
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    // 统一按3.35字符/token估算（与SillyTavern一致）
    const tokens = Math.ceil(text.length / 3.35);

    // 添加到缓存
    this.addToCache(cacheKey, tokens);

    return tokens;
  }

  /**
   * 批量计算Token数量（性能优化）
   * @param texts 文本数组
   * @returns Token数量数组
   */
  batchEstimateTokens(texts: string[]): number[] {
    return texts.map((text) => this.estimateTokens(text));
  }

  /**
   * 为组件计算Token数量
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
   * 应用Token预算控制（核心方法）
   * @param bucket 位置桶
   * @param budget Token预算配置
   * @returns 裁剪后的位置桶和统计信息
   */
  applyBudget(
    bucket: PositionBucket,
    budget: TokenBudget,
  ): { bucket: PositionBucket; stats: TokenStats } {
    // 步骤1：计算所有组件的Token
    bucket = this.calculateTokensForBucket(bucket);

    // 步骤2：计算世界书预算
    const worldBookBudget = this.calculateWorldBookBudget(bucket, budget);

    this.logger.debug(
      `世界书预算: ${worldBookBudget} tokens (总预算: ${budget.total})`,
    );

    // 步骤3：分离组件类型
    const {
      required,
      ignoreBudget,
      worldBook,
      other,
    } = this.categorizeComponents(bucket);

    // 步骤4：应用预算分配策略
    const allocatedWorldBook = this.allocateBudget(
      worldBook,
      worldBookBudget,
      budget.budgetPriority || 'order',
    );

    // 步骤5：组装最终桶
    let finalBucket = this.assembleFinalBucket(
      bucket,
      required,
      ignoreBudget,
      allocatedWorldBook,
      other,
    );

    // 步骤6：计算统计信息
    let stats = this.calculateDetailedStats(
      finalBucket,
      budget,
      worldBookBudget,
      worldBook.length,
      allocatedWorldBook.length,
      ignoreBudget.length,
    );

    // 步骤7：检查是否需要扩展预算
    if (budget.allowBudgetExpand && stats.overBudget) {
      const expandResult = this.tryExpandBudget(
        bucket,
        budget,
        worldBookBudget,
        stats,
      );
      finalBucket = expandResult.bucket;
      stats = expandResult.stats;
    }

    this.logger.debug(
      `预算控制完成: 总Token=${stats.total}, 超预算=${stats.overBudget}`,
    );

    return { bucket: finalBucket, stats };
  }

  /**
   * 计算世界书预算
   * 支持三种方式：固定值、百分比、动态调整
   */
  private calculateWorldBookBudget(
    bucket: PositionBucket,
    budget: TokenBudget,
  ): number {
    // 计算可分配预算
    const safetyMargin = budget.safetyMargin || 100;
    const fixedComponentsTokens = this.sumTokens([
      ...bucket.systemPrompts,
      ...bucket.charDef,
      ...bucket.latestInput,
    ]);

    const allocatable = budget.total - fixedComponentsTokens - safetyMargin;

    let worldBookBudget: number;

    // 方式1：固定值（优先级最高）
    if (budget.worldBookBudget !== undefined) {
      worldBookBudget = budget.worldBookBudget;
      this.logger.debug(`使用固定世界书预算: ${worldBookBudget}`);
    }
    // 方式2：百分比
    else if (budget.worldBookRatio !== undefined) {
      worldBookBudget = Math.floor(allocatable * budget.worldBookRatio);
      this.logger.debug(
        `使用百分比计算: ${allocatable} * ${budget.worldBookRatio} = ${worldBookBudget}`,
      );
    }
    // 方式3：默认25%
    else {
      worldBookBudget = Math.floor(allocatable * 0.25);
      this.logger.debug(`使用默认25%: ${worldBookBudget}`);
    }

    // 方式3：动态调整（应用最小值和最大值限制）
    if (budget.worldBookBudgetMin !== undefined) {
      worldBookBudget = Math.max(worldBookBudget, budget.worldBookBudgetMin);
    }
    if (budget.worldBookBudgetMax !== undefined) {
      worldBookBudget = Math.min(worldBookBudget, budget.worldBookBudgetMax);
    }

    return worldBookBudget;
  }

  /**
   * 分类组件
   * 将组件分为：必需、忽略预算、世界书、其他
   */
  private categorizeComponents(bucket: PositionBucket): {
    required: PromptComponent[];
    ignoreBudget: PromptComponent[];
    worldBook: PromptComponent[];
    other: PromptComponent[];
  } {
    const allComponents = [
      ...bucket.systemPrompts,
      ...bucket.beforeChar,
      ...bucket.charDef,
      ...bucket.afterChar,
      ...bucket.exampleTop,
      ...bucket.examples,
      ...bucket.exampleBottom,
      ...bucket.history,
      ...bucket.depthInjections,
      ...bucket.anTop,
      ...bucket.anBottom,
      ...bucket.latestInput,
    ];

    const required = allComponents.filter((c) => c.required);
    const ignoreBudget = allComponents.filter((c) => c.ignoreBudget);
    const worldBook = allComponents.filter((c) =>
      c.identifier.startsWith('worldbook'),
    );
    const other = allComponents.filter(
      (c) =>
        !c.required && !c.ignoreBudget && !c.identifier.startsWith('worldbook'),
    );

    return { required, ignoreBudget, worldBook, other };
  }

  /**
   * 分配预算（核心算法）
   * 根据策略对组件排序并分配Token预算
   */
  private allocateBudget(
    components: PromptComponent[],
    budget: number,
    strategy: 'order' | 'activation_order' | 'token_efficiency' | 'relevance',
  ): PromptComponent[] {
    if (components.length === 0) return [];

    // 按策略排序
    const sorted = this.sortByStrategy(components, strategy);

    // 分配预算
    const allocated: PromptComponent[] = [];
    let usedTokens = 0;

    for (const component of sorted) {
      const tokens = component.tokens || 0;

      if (usedTokens + tokens <= budget) {
        allocated.push(component);
        usedTokens += tokens;
      } else {
        this.logger.debug(
          `组件 ${component.identifier} 超出预算，跳过 (需要${tokens}, 剩余${budget - usedTokens})`,
        );
      }
    }

    this.logger.debug(
      `预算分配完成: ${allocated.length}/${components.length} 组件, 使用${usedTokens}/${budget} tokens`,
    );

    return allocated;
  }

  /**
   * 按策略排序组件
   */
  private sortByStrategy(
    components: PromptComponent[],
    strategy: 'order' | 'activation_order' | 'token_efficiency' | 'relevance',
  ): PromptComponent[] {
    const sorted = [...components];

    switch (strategy) {
      case 'order':
        // 按order升序（越小优先级越高）
        sorted.sort((a, b) => (a.order || 100) - (b.order || 100));
        break;

      case 'activation_order':
        // 按激活顺序
        sorted.sort(
          (a, b) =>
            (a.activationOrder || 0) - (b.activationOrder || 0),
        );
        break;

      case 'token_efficiency':
        // 按Token效率（匹配次数 / Token数）
        sorted.sort((a, b) => {
          const efficiencyA =
            (a.matchCount || 1) / Math.max(a.tokens || 1, 1);
          const efficiencyB =
            (b.matchCount || 1) / Math.max(b.tokens || 1, 1);
          return efficiencyB - efficiencyA; // 降序
        });
        break;

      case 'relevance':
        // 按相关性评分
        sorted.sort((a, b) => {
          const scoreA = this.calculateRelevanceScore(a);
          const scoreB = this.calculateRelevanceScore(b);
          return scoreB - scoreA; // 降序
        });
        break;
    }

    return sorted;
  }

  /**
   * 计算相关性评分
   */
  private calculateRelevanceScore(component: PromptComponent): number {
    let score = component.matchCount || 0;

    // 加分项
    if (component.constant) score += 5;
    if (component.order !== undefined && component.order < 50) score += 15;

    return score;
  }

  /**
   * 组装最终桶
   */
  private assembleFinalBucket(
    originalBucket: PositionBucket,
    required: PromptComponent[],
    ignoreBudget: PromptComponent[],
    allocatedWorldBook: PromptComponent[],
    other: PromptComponent[],
  ): PositionBucket {
    // 合并所有激活的组件
    const activated = new Set([
      ...required.map((c) => c.identifier),
      ...ignoreBudget.map((c) => c.identifier),
      ...allocatedWorldBook.map((c) => c.identifier),
    ]);

    // 过滤每个桶，只保留激活的组件
    return {
      systemPrompts: originalBucket.systemPrompts.filter((c) =>
        activated.has(c.identifier),
      ),
      beforeChar: originalBucket.beforeChar.filter((c) =>
        activated.has(c.identifier),
      ),
      charDef: originalBucket.charDef.filter((c) =>
        activated.has(c.identifier),
      ),
      afterChar: originalBucket.afterChar.filter((c) =>
        activated.has(c.identifier),
      ),
      exampleTop: originalBucket.exampleTop.filter((c) =>
        activated.has(c.identifier),
      ),
      examples: originalBucket.examples.filter((c) =>
        activated.has(c.identifier),
      ),
      exampleBottom: originalBucket.exampleBottom.filter((c) =>
        activated.has(c.identifier),
      ),
      history: originalBucket.history.filter((c) =>
        activated.has(c.identifier),
      ),
      depthInjections: originalBucket.depthInjections.filter((c) =>
        activated.has(c.identifier),
      ),
      anTop: originalBucket.anTop.filter((c) => activated.has(c.identifier)),
      anBottom: originalBucket.anBottom.filter((c) =>
        activated.has(c.identifier),
      ),
      latestInput: originalBucket.latestInput.filter((c) =>
        activated.has(c.identifier),
      ),
    };
  }

  /**
   * 计算详细统计信息
   */
  private calculateDetailedStats(
    bucket: PositionBucket,
    budget: TokenBudget,
    worldBookBudget: number,
    totalCandidates: number,
    activated: number,
    ignoredBudgetCount: number,
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

    const safetyMargin = budget.safetyMargin || 100;
    const allocatable = budget.total - safetyMargin;
    const used = total;
    const remaining = budget.total - total;

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
      trimmedComponents: totalCandidates - activated,
      budgetDetails: {
        allocatable,
        worldBookBudget,
        used,
        remaining,
        percentage: (used / budget.total) * 100,
      },
      activationDetails: {
        totalCandidates,
        activated,
        skippedBudget: totalCandidates - activated - ignoredBudgetCount,
        ignoredBudget: ignoredBudgetCount,
      },
    };
  }

  /**
   * 尝试扩展预算
   */
  private tryExpandBudget(
    bucket: PositionBucket,
    budget: TokenBudget,
    worldBookBudget: number,
    stats: TokenStats,
  ): { bucket: PositionBucket; stats: TokenStats } {
    const maxTimes = budget.maxExpandTimes || 3;
    const minActivations = budget.minActivations || 3;

    let expandedBudget = budget.total;
    let expandTimes = 0;

    const originalBudget = budget.total;

    while (
      expandTimes < maxTimes &&
      (stats.overBudget ||
        (stats.activationDetails?.activated || 0) < minActivations)
    ) {
      expandTimes++;
      expandedBudget = Math.floor(expandedBudget * 1.1); // 每次扩展10%

      this.logger.warn(
        `预算扩展第${expandTimes}次: ${budget.total} → ${expandedBudget}`,
      );

      // 使用新预算重新计算
      const newBudget: TokenBudget = { ...budget, total: expandedBudget };
      const newWorldBookBudget = this.calculateWorldBookBudget(bucket, newBudget);

      const { required, ignoreBudget, worldBook, other } =
        this.categorizeComponents(bucket);

      const allocatedWorldBook = this.allocateBudget(
        worldBook,
        newWorldBookBudget,
        budget.budgetPriority || 'order',
      );

      const newBucket = this.assembleFinalBucket(
        bucket,
        required,
        ignoreBudget,
        allocatedWorldBook,
        other,
      );

      stats = this.calculateDetailedStats(
        newBucket,
        newBudget,
        newWorldBookBudget,
        worldBook.length,
        allocatedWorldBook.length,
        ignoreBudget.length,
      );

      if (!stats.overBudget && (stats.activationDetails?.activated || 0) >= minActivations) {
        bucket = newBucket;
        break;
      }
    }

    // 添加扩展信息
    if (expandTimes > 0) {
      stats.expansionInfo = {
        expanded: true,
        times: expandTimes,
        originalBudget,
        finalBudget: expandedBudget,
      };
    }

    return { bucket, stats };
  }

  /**
   * 为位置桶中的所有组件计算Token
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
   * 计算组件数组的总Token数
   */
  private sumTokens(components: PromptComponent[]): number {
    return components.reduce((sum, c) => sum + (c.tokens || 0), 0);
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(text: string): string {
    // 使用简单哈希（生产环境应使用更好的哈希函数）
    return `${text.length}_${text.substring(0, 50)}`;
  }

  /**
   * 添加到缓存（LRU策略）
   */
  private addToCache(key: string, value: number): void {
    // 如果缓存满了，删除最旧的
    if (this.tokenCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.tokenCache.keys().next().value;
      this.tokenCache.delete(firstKey);
    }

    this.tokenCache.set(key, value);
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.tokenCache.clear();
    this.logger.debug('Token缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.tokenCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0, // TODO: 实现命中率统计
    };
  }

  /**
   * 生成详细预算报告（用于调试）
   */
  generateBudgetReport(stats: TokenStats): string {
    const lines: string[] = [];

    lines.push('[Token预算管理] 详细报告');
    lines.push('─'.repeat(50));

    if (stats.budgetDetails) {
      const bd = stats.budgetDetails;
      lines.push(`总预算: ${bd.allocatable + (bd.used - bd.allocatable)} tokens`);
      lines.push(`已使用: ${bd.used} tokens (${bd.percentage.toFixed(1)}%)`);
      lines.push(`剩余: ${bd.remaining} tokens`);
      lines.push(`世界书预算: ${bd.worldBookBudget} tokens`);
    }

    lines.push('─'.repeat(50));
    lines.push('组件Token分布:');
    lines.push(`  系统提示: ${stats.systemPrompts} tokens`);
    lines.push(`  角色定义: ${stats.characterDef} tokens`);
    lines.push(`  示例消息: ${stats.examples} tokens`);
    lines.push(`  世界书: ${stats.worldBook} tokens`);
    lines.push(`  历史消息: ${stats.history} tokens`);
    lines.push(`  Author's Note: ${stats.authorNote} tokens`);
    lines.push(`  用户输入: ${stats.userInput} tokens`);

    if (stats.activationDetails) {
      const ad = stats.activationDetails;
      lines.push('─'.repeat(50));
      lines.push('激活统计:');
      lines.push(`  总候选: ${ad.totalCandidates} 个组件`);
      lines.push(`  ✓ 已激活: ${ad.activated} 个`);
      lines.push(`  ⊗ 预算不足跳过: ${ad.skippedBudget} 个`);
      lines.push(`  ⚡ 强制激活(ignoreBudget): ${ad.ignoredBudget} 个`);
    }

    if (stats.expansionInfo?.expanded) {
      const ei = stats.expansionInfo;
      lines.push('─'.repeat(50));
      lines.push('预算扩展信息:');
      lines.push(`  扩展次数: ${ei.times}`);
      lines.push(`  原始预算: ${ei.originalBudget} tokens`);
      lines.push(`  最终预算: ${ei.finalBudget} tokens`);
    }

    lines.push('─'.repeat(50));

    return lines.join('\n');
  }
}
