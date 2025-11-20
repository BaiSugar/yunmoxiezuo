import { Injectable, Logger } from '@nestjs/common';
import { WorldBookEntry } from '../interfaces/world-book-entry.interface';
import { AdvancedTokenManagerService } from '../../prompts/builders/advanced-token-manager.service';

/**
 * 世界书Token预算管理服务
 * 基于AdvancedTokenManagerService实现预算控制
 * 
 * 核心逻辑：
 * 1. 计算所有候选条目的Token数
 * 2. 按策略排序（order/activation_order/token_efficiency/relevance）
 * 3. 逐个添加条目，直到达到预算上限
 * 4. ignoreBudget=true的条目强制激活（不计入预算）
 */
@Injectable()
export class WorldBookBudgetService {
  private readonly logger = new Logger(WorldBookBudgetService.name);

  constructor(
    private readonly tokenManager: AdvancedTokenManagerService,
  ) {}

  /**
   * 应用Token预算控制
   * @param entries 候选条目列表
   * @param budgetConfig 预算配置
   * @returns 预算内的条目列表和统计信息
   */
  applyBudget(
    entries: WorldBookEntry[],
    budgetConfig: {
      worldBookBudget: number;
      budgetPriority: 'order' | 'activation_order' | 'token_efficiency' | 'relevance';
    },
  ): {
    entries: WorldBookEntry[];
    stats: {
      totalCandidates: number;
      activated: number;
      skipped: number;
      ignoredBudget: number;
      budgetUsed: number;
      budgetLimit: number;
    };
  } {
    if (entries.length === 0) {
      return {
        entries: [],
        stats: {
          totalCandidates: 0,
          activated: 0,
          skipped: 0,
          ignoredBudget: 0,
          budgetUsed: 0,
          budgetLimit: budgetConfig.worldBookBudget,
        },
      };
    }

    this.logger.debug(
      `开始Token预算控制: ${entries.length}个候选, 预算${budgetConfig.worldBookBudget}`,
    );

    // 1. 计算所有条目的Token数
    const entriesWithTokens = entries.map((entry) => ({
      ...entry,
      tokens: this.tokenManager.estimateTokens(entry.content),
    }));

    // 2. 分离强制激活的条目（ignoreBudget）
    const ignoreBudgetEntries = entriesWithTokens.filter(
      (e) => e.ignoreBudget,
    );
    const budgetAwareEntries = entriesWithTokens.filter(
      (e) => !e.ignoreBudget,
    );

    this.logger.debug(
      `分离条目: ${ignoreBudgetEntries.length}个强制激活, ${budgetAwareEntries.length}个受预算限制`,
    );

    // 3. 按策略排序受预算限制的条目
    const sorted = this.sortByStrategy(
      budgetAwareEntries,
      budgetConfig.budgetPriority,
    );

    // 4. 分配预算
    const allocated: WorldBookEntry[] = [];
    let budgetUsed = 0;

    for (const entry of sorted) {
      const tokens = entry.tokens || 0;

      if (budgetUsed + tokens <= budgetConfig.worldBookBudget) {
        allocated.push(entry);
        budgetUsed += tokens;
      } else {
        this.logger.debug(
          `条目 "${entry.name}" 超出预算，跳过 (需要${tokens}, 剩余${budgetConfig.worldBookBudget - budgetUsed})`,
        );
      }
    }

    // 5. 合并强制激活和预算内的条目
    const finalEntries = [...ignoreBudgetEntries, ...allocated];

    // 6. 统计信息
    const stats = {
      totalCandidates: entries.length,
      activated: finalEntries.length,
      skipped: budgetAwareEntries.length - allocated.length,
      ignoredBudget: ignoreBudgetEntries.length,
      budgetUsed,
      budgetLimit: budgetConfig.worldBookBudget,
    };

    this.logger.debug(
      `预算控制完成: ${stats.activated}/${stats.totalCandidates} 个条目, 使用${budgetUsed}/${budgetConfig.worldBookBudget} tokens`,
    );

    return { entries: finalEntries, stats };
  }

  /**
   * 按策略排序条目
   */
  private sortByStrategy(
    entries: WorldBookEntry[],
    strategy: 'order' | 'activation_order' | 'token_efficiency' | 'relevance',
  ): WorldBookEntry[] {
    const sorted = [...entries];

    switch (strategy) {
      case 'order':
        // 按order升序（越小优先级越高）
        sorted.sort((a, b) => (a.order || 100) - (b.order || 100));
        this.logger.debug('[排序策略] order');
        break;

      case 'activation_order':
        // 按激活顺序
        sorted.sort(
          (a, b) => (a.activationOrder || 0) - (b.activationOrder || 0),
        );
        this.logger.debug('[排序策略] activation_order');
        break;

      case 'token_efficiency':
        // 按Token效率（匹配次数 / Token数）
        sorted.sort((a, b) => {
          const efficiencyA = (a.matchCount || 1) / Math.max(a.tokens || 1, 1);
          const efficiencyB = (b.matchCount || 1) / Math.max(b.tokens || 1, 1);
          return efficiencyB - efficiencyA; // 降序
        });
        this.logger.debug('[排序策略] token_efficiency');
        break;

      case 'relevance':
        // 按相关性评分
        sorted.sort((a, b) => {
          const scoreA = this.calculateRelevanceScore(a);
          const scoreB = this.calculateRelevanceScore(b);
          return scoreB - scoreA; // 降序
        });
        this.logger.debug('[排序策略] relevance');
        break;
    }

    return sorted;
  }

  /**
   * 计算相关性评分
   */
  private calculateRelevanceScore(entry: WorldBookEntry): number {
    let score = entry.matchCount || 0;

    // 加分项
    if (entry.constant) score += 5;
    if (entry.order !== undefined && entry.order < 50) score += 15;

    return score;
  }
}
