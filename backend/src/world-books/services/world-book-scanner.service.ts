import { Injectable, Logger } from '@nestjs/common';
import {
  WorldBookEntry,
  RoleplayConfig,
} from '../interfaces/world-book-entry.interface';
import { WorldBookBufferService } from './world-book-buffer.service';
import { WorldBookTimedEffectsService } from './world-book-timed-effects.service';
import { WorldBookRecursiveService } from './world-book-recursive.service';
import { WorldBookInclusionGroupService } from './world-book-inclusion-group.service';
import { WorldBookBudgetService } from './world-book-budget.service';
import { WorldBookMinActivationsService } from './world-book-min-activations.service';

/**
 * 扫描参数
 */
export interface ScanParams {
  /** 会话ID */
  sessionId: string;

  /** 提示词ID */
  promptId: number;

  /** 角色扮演配置 */
  roleplayConfig: RoleplayConfig;

  /** 当前用户消息 */
  currentMessage: string;

  /** 历史消息列表（按时间降序） */
  historyMessages: string[];

  /** 当前消息索引 */
  messageIndex: number;
}

/**
 * 世界书扫描器服务（增强版）
 * 核心职责：扫描并激活世界书条目
 * 
 * 新增功能：
 * ✅ 递归扫描（链式激活）
 * ✅ 包含组过滤（互斥选择）
 * ✅ Token预算管理（防止上下文爆炸）
 * ✅ 最小激活数保证
 */
@Injectable()
export class WorldBookScannerService {
  private readonly logger = new Logger(WorldBookScannerService.name);

  constructor(
    private readonly bufferService: WorldBookBufferService,
    private readonly timedEffectsService: WorldBookTimedEffectsService,
    private readonly recursiveService: WorldBookRecursiveService,
    private readonly inclusionGroupService: WorldBookInclusionGroupService,
    private readonly budgetService: WorldBookBudgetService,
    private readonly minActivationsService: WorldBookMinActivationsService,
  ) {}

  /**
   * 扫描并激活世界书条目（增强版）
   * @param params 扫描参数
   * @param worldBookBudget Token预算（可选）
   * @returns 激活的条目列表
   */
  async scan(
    params: ScanParams,
    worldBookBudget?: number,
  ): Promise<WorldBookEntry[]> {
    const { roleplayConfig, sessionId, promptId } = params;

    // 1. 获取世界书条目
    const entries = roleplayConfig.worldBookEntries || [];
    if (entries.length === 0) {
      this.logger.debug('无世界书条目，跳过扫描');
      return [];
    }

    this.logger.debug(`开始世界书扫描，共 ${entries.length} 个条目`);

    let activated: WorldBookEntry[] = [];

    // 2. 选择扫描策略：递归 vs 非递归
    if (roleplayConfig.enableRecursion) {
      // 递归扫描
      this.logger.debug('使用递归扫描模式');
      activated = await this.recursiveService.scanRecursive({
        sessionId,
        promptId,
        entries,
        currentMessage: params.currentMessage,
        historyMessages: params.historyMessages,
        messageIndex: params.messageIndex,
        maxRecursionDepth: roleplayConfig.maxRecursionDepth || 5,
      });
    } else {
      // 非递归扫描（原有逻辑）
      this.logger.debug('使用非递归扫描模式');
      activated = await this.scanNonRecursive(params);
    }

    this.logger.debug(`初步扫描完成，激活 ${activated.length} 个条目`);

    // 3. 包含组过滤（互斥选择）
    activated = await this.inclusionGroupService.filterInclusionGroups(
      activated,
      sessionId,
      promptId,
    );

    this.logger.debug(`包含组过滤后，剩余 ${activated.length} 个条目`);

    // 4. Token预算控制
    if (worldBookBudget !== undefined && worldBookBudget > 0) {
      const budgetResult = this.budgetService.applyBudget(activated, {
        worldBookBudget,
        budgetPriority: roleplayConfig.budgetPriority || 'order',
      });

      activated = budgetResult.entries;

      this.logger.debug(
        `Token预算控制: ${budgetResult.stats.activated}/${budgetResult.stats.totalCandidates} 个条目, ` +
          `使用 ${budgetResult.stats.budgetUsed}/${budgetResult.stats.budgetLimit} tokens`,
      );
    }

    // 5. 最小激活数保证
    if (roleplayConfig.minActivations && roleplayConfig.minActivations > 0) {
      activated = this.minActivationsService.ensureMinActivations(
        activated,
        entries,
        roleplayConfig.minActivations,
      );

      this.logger.debug(`最小激活保证后，共 ${activated.length} 个条目`);
    }

    // 6. 最终按 order 排序
    const sorted = activated.sort((a, b) => (a.order || 100) - (b.order || 100));

    this.logger.debug(`世界书扫描完成，最终激活 ${sorted.length} 个条目`);

    return sorted;
  }

  /**
   * 非递归扫描（原有逻辑）
   */
  private async scanNonRecursive(params: ScanParams): Promise<WorldBookEntry[]> {
    const { roleplayConfig, currentMessage, historyMessages, messageIndex } =
      params;

    const entries = roleplayConfig.worldBookEntries || [];
    const scanDepth = roleplayConfig.scanDepth || 4;
    const scanText = this.bufferService.buildScanText(
      currentMessage,
      historyMessages,
      scanDepth,
    );

    const activated: WorldBookEntry[] = [];

    for (const entry of entries) {
      if (entry.disable) continue;

      if (entry.constant) {
        activated.push(entry);
        continue;
      }

      const isSticky = await this.timedEffectsService.isSticky(
        params.sessionId,
        params.promptId,
        entry.uid,
      );

      if (isSticky) {
        activated.push(entry);
        await this.timedEffectsService.decrementSticky(
          params.sessionId,
          params.promptId,
          entry.uid,
        );
        continue;
      }

      const isCooldown = await this.timedEffectsService.isCooldown(
        params.sessionId,
        params.promptId,
        entry.uid,
      );

      if (isCooldown) {
        await this.timedEffectsService.decrementCooldown(
          params.sessionId,
          params.promptId,
          entry.uid,
        );
        continue;
      }

      const isDelay = this.timedEffectsService.isDelay(entry, messageIndex);
      if (isDelay) continue;

      const matched = this.bufferService.matchKeywords(entry, scanText);

      if (matched) {
        activated.push(entry);
        await this.timedEffectsService.setActivationState(
          params.sessionId,
          params.promptId,
          entry,
          messageIndex,
        );
      }
    }

    return activated;
  }

  /**
   * 构建世界书输出
   * 根据位置分组激活的条目
   * @param activatedEntries 激活的条目列表
   * @returns 分组后的世界书内容
   */
  buildOutput(activatedEntries: WorldBookEntry[]): {
    before: string;
    after: string;
    anTop: string;
    anBottom: string;
    atDepth: Map<number, string>;
    emTop: string;
    emBottom: string;
    outlets: Map<string, string>;
  } {
    const before: string[] = [];
    const after: string[] = [];
    const anTop: string[] = [];
    const anBottom: string[] = [];
    const atDepth = new Map<number, string[]>();
    const emTop: string[] = [];
    const emBottom: string[] = [];
    const outlets = new Map<string, string[]>();

    for (const entry of activatedEntries) {
      const content = entry.content;

      switch (entry.position) {
        case 'before':
          before.unshift(content); // 使用 unshift 保持与 SillyTavern 一致
          break;

        case 'after':
          after.unshift(content);
          break;

        case 'ANTop':
          anTop.unshift(content);
          break;

        case 'ANBottom':
          anBottom.unshift(content);
          break;

        case 'atDepth':
          const depth = entry.depth || 0;
          if (!atDepth.has(depth)) {
            atDepth.set(depth, []);
          }
          atDepth.get(depth)!.unshift(content);
          break;

        case 'EMTop':
          emTop.unshift(content);
          break;

        case 'EMBottom':
          emBottom.unshift(content);
          break;

        case 'outlet':
          const outletName = entry.outletName || 'default';
          if (!outlets.has(outletName)) {
            outlets.set(outletName, []);
          }
          outlets.get(outletName)!.push(content);
          break;
      }
    }

    // 将数组转换为字符串
    const atDepthResult = new Map<number, string>();
    atDepth.forEach((contents, depth) => {
      atDepthResult.set(depth, contents.join('\n'));
    });

    const outletsResult = new Map<string, string>();
    outlets.forEach((contents, name) => {
      outletsResult.set(name, contents.join('\n'));
    });

    return {
      before: before.join('\n'),
      after: after.join('\n'),
      anTop: anTop.join('\n'),
      anBottom: anBottom.join('\n'),
      atDepth: atDepthResult,
      emTop: emTop.join('\n'),
      emBottom: emBottom.join('\n'),
      outlets: outletsResult,
    };
  }
}
