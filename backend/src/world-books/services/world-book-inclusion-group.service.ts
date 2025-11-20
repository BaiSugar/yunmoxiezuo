import { Injectable, Logger } from '@nestjs/common';
import { WorldBookEntry } from '../interfaces/world-book-entry.interface';
import { WorldBookTimedEffectsService } from './world-book-timed-effects.service';

/**
 * 包含组过滤服务
 * 实现SillyTavern的Inclusion Groups机制
 * 
 * 核心逻辑：
 * 1. 将条目按group分组
 * 2. 每组只能激活一个条目（互斥）
 * 3. 选择策略：Sticky优先 → Override优先 → 评分/随机
 */
@Injectable()
export class WorldBookInclusionGroupService {
  private readonly logger = new Logger(WorldBookInclusionGroupService.name);

  constructor(
    private readonly timedEffectsService: WorldBookTimedEffectsService,
  ) {}

  /**
   * 过滤包含组
   * @param entries 候选条目列表
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @returns 过滤后的条目列表
   */
  async filterInclusionGroups(
    entries: WorldBookEntry[],
    sessionId: string,
    promptId: number,
  ): Promise<WorldBookEntry[]> {
    // 1. 分组：有group的和无group的
    const ungrouped: WorldBookEntry[] = [];
    const grouped = new Map<string, WorldBookEntry[]>();

    for (const entry of entries) {
      if (!entry.group) {
        ungrouped.push(entry);
      } else {
        if (!grouped.has(entry.group)) {
          grouped.set(entry.group, []);
        }
        grouped.get(entry.group)!.push(entry);
      }
    }

    this.logger.debug(
      `包含组过滤: ${ungrouped.length}个无组条目, ${grouped.size}个组`,
    );

    // 2. 处理每个组，选出一个条目
    const selected: WorldBookEntry[] = [...ungrouped];

    for (const [groupName, groupEntries] of grouped.entries()) {
      if (groupEntries.length === 1) {
        // 组内只有一个条目，直接选择
        selected.push(groupEntries[0]);
        continue;
      }

      // 执行选择策略
      const winner = await this.selectFromGroup(
        groupName,
        groupEntries,
        sessionId,
        promptId,
      );

      if (winner) {
        selected.push(winner);
        this.logger.debug(
          `组 "${groupName}" 选择: ${winner.name} (${winner.uid})`,
        );
      }
    }

    return selected;
  }

  /**
   * 从组内选择一个条目
   * 优先级：Sticky > Override > Scoring/Random
   */
  private async selectFromGroup(
    groupName: string,
    entries: WorldBookEntry[],
    sessionId: string,
    promptId: number,
  ): Promise<WorldBookEntry | null> {
    if (entries.length === 0) return null;

    // 策略1：Sticky优先（保持状态连续性）
    for (const entry of entries) {
      const isSticky = await this.timedEffectsService.isSticky(
        sessionId,
        promptId,
        entry.uid,
      );

      if (isSticky) {
        this.logger.debug(
          `[Sticky优先] 组 "${groupName}": ${entry.name}`,
        );
        return entry;
      }
    }

    // 策略2：Override优先（强制覆盖）
    const overrideEntries = entries.filter((e) => e.groupOverride);
    if (overrideEntries.length > 0) {
      // 按order排序，选最小的
      overrideEntries.sort((a, b) => (a.order || 100) - (b.order || 100));
      this.logger.debug(
        `[Override优先] 组 "${groupName}": ${overrideEntries[0].name}`,
      );
      return overrideEntries[0];
    }

    // 策略3：评分选择 vs 随机选择
    const useScoring = entries.some((e) => e.useGroupScoring);

    if (useScoring) {
      return this.selectByScoring(groupName, entries);
    } else {
      return this.selectByWeightedRandom(groupName, entries);
    }
  }

  /**
   * 按评分选择
   * 评分 = 关键词匹配次数 × groupWeight
   */
  private selectByScoring(
    groupName: string,
    entries: WorldBookEntry[],
  ): WorldBookEntry {
    const scored = entries.map((entry) => ({
      entry,
      score: (entry.matchCount || 1) * (entry.groupWeight || 100),
    }));

    // 按评分降序
    scored.sort((a, b) => b.score - a.score);

    const winner = scored[0].entry;
    this.logger.debug(
      `[评分选择] 组 "${groupName}": ${winner.name} (评分:${scored[0].score})`,
    );

    return winner;
  }

  /**
   * 加权随机选择
   */
  private selectByWeightedRandom(
    groupName: string,
    entries: WorldBookEntry[],
  ): WorldBookEntry {
    // 计算总权重
    const totalWeight = entries.reduce(
      (sum, entry) => sum + (entry.groupWeight || 100),
      0,
    );

    // 生成随机数
    let random = Math.random() * totalWeight;

    // 选择
    for (const entry of entries) {
      random -= entry.groupWeight || 100;
      if (random <= 0) {
        this.logger.debug(
          `[加权随机] 组 "${groupName}": ${entry.name} (权重:${entry.groupWeight || 100})`,
        );
        return entry;
      }
    }

    // 兜底：返回第一个
    return entries[0];
  }
}
