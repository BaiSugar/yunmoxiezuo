import { Injectable, Logger } from '@nestjs/common';
import { WorldBookEntry } from '../interfaces/world-book-entry.interface';
import { WorldBookBufferService } from './world-book-buffer.service';
import { WorldBookTimedEffectsService } from './world-book-timed-effects.service';

/**
 * 递归扫描服务
 * 实现SillyTavern的递归扫描机制
 * 
 * 核心逻辑：
 * 1. 第0轮：扫描历史消息 → 激活条目A, B, C
 * 2. 第1轮：扫描历史+A+B+C的内容 → 激活条目D, E
 * 3. 第2轮：扫描历史+所有已激活内容 → 激活条目F
 * 4. 第3轮：无新激活 → 停止递归
 */
@Injectable()
export class WorldBookRecursiveService {
  private readonly logger = new Logger(WorldBookRecursiveService.name);

  constructor(
    private readonly bufferService: WorldBookBufferService,
    private readonly timedEffectsService: WorldBookTimedEffectsService,
  ) {}

  /**
   * 执行递归扫描
   * @param params 扫描参数
   * @param entries 所有世界书条目
   * @returns 所有递归激活的条目
   */
  async scanRecursive(params: {
    sessionId: string;
    promptId: number;
    entries: WorldBookEntry[];
    currentMessage: string;
    historyMessages: string[];
    messageIndex: number;
    maxRecursionDepth: number;
  }): Promise<WorldBookEntry[]> {
    const maxDepth = params.maxRecursionDepth || 5;
    const allActivated: WorldBookEntry[] = [];
    const activatedUids = new Set<string>();

    let recursionDepth = 0;
    let recursionBuffer: string[] = [];

    this.logger.debug(`开始递归扫描，最大深度：${maxDepth}`);

    // 递归扫描循环
    while (recursionDepth < maxDepth) {
      this.logger.debug(`第${recursionDepth}轮递归扫描`);

      // 构建当前轮次的扫描文本
      const scanText = this.buildRecursiveScanText(
        params.currentMessage,
        params.historyMessages,
        recursionBuffer,
      );

      // 扫描条目
      const roundActivated: WorldBookEntry[] = [];

      for (const entry of params.entries) {
        // 1. 跳过已激活的条目
        if (activatedUids.has(entry.uid)) {
          continue;
        }

        // 2. 跳过禁用的条目
        if (entry.disable) {
          continue;
        }

        // 3. 递归深度控制
        if (recursionDepth === 0) {
          // 第0轮：所有条目都可以激活
        } else {
          // 递归轮次：检查 preventRecursion
          if (entry.preventRecursion) {
            continue; // 只在第0轮能被激活
          }

          // 检查 delayUntilRecursion
          if (
            entry.delayUntilRecursion !== undefined &&
            recursionDepth < entry.delayUntilRecursion
          ) {
            continue; // 还没到指定的递归轮次
          }
        }

        // 4. 常驻条目（第0轮激活一次）
        if (entry.constant && recursionDepth === 0) {
          roundActivated.push(entry);
          activatedUids.add(entry.uid);
          continue;
        }

        // 5. 检查粘性状态
        const isSticky = await this.timedEffectsService.isSticky(
          params.sessionId,
          params.promptId,
          entry.uid,
        );

        if (isSticky) {
          roundActivated.push(entry);
          activatedUids.add(entry.uid);
          await this.timedEffectsService.decrementSticky(
            params.sessionId,
            params.promptId,
            entry.uid,
          );
          continue;
        }

        // 6. 检查冷却状态
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

        // 7. 检查延迟状态
        const isDelay = this.timedEffectsService.isDelay(
          entry,
          params.messageIndex,
        );

        if (isDelay) {
          continue;
        }

        // 8. 关键词匹配
        const matched = this.bufferService.matchKeywords(entry, scanText);

        if (matched) {
          roundActivated.push(entry);
          activatedUids.add(entry.uid);

          // 设置时效性状态
          await this.timedEffectsService.setActivationState(
            params.sessionId,
            params.promptId,
            entry,
            params.messageIndex,
          );

          this.logger.debug(
            `[第${recursionDepth}轮] 激活条目: ${entry.name} (${entry.uid})`,
          );
        }
      }

      // 9. 本轮没有新激活，停止递归
      if (roundActivated.length === 0) {
        this.logger.debug(`第${recursionDepth}轮无新激活，停止递归`);
        break;
      }

      // 10. 记录本轮激活的条目
      allActivated.push(...roundActivated);

      // 11. 将本轮激活的内容加入递归缓冲区
      for (const entry of roundActivated) {
        if (!entry.excludeRecursion) {
          recursionBuffer.push(entry.content);
        }
      }

      recursionDepth++;
    }

    this.logger.debug(
      `递归扫描完成，共${recursionDepth}轮，激活${allActivated.length}个条目`,
    );

    return allActivated;
  }

  /**
   * 构建递归扫描文本
   */
  private buildRecursiveScanText(
    currentMessage: string,
    historyMessages: string[],
    recursionBuffer: string[],
  ): string {
    const texts: string[] = [currentMessage];

    // 添加历史消息
    texts.push(...historyMessages.slice(0, 4)); // 最近4条

    // 添加递归激活的内容
    if (recursionBuffer.length > 0) {
      texts.push(...recursionBuffer);
    }

    return texts.join('\n').toLowerCase();
  }
}
