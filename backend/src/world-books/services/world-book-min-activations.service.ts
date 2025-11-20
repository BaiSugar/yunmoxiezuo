import { Injectable, Logger } from '@nestjs/common';
import { WorldBookEntry } from '../interfaces/world-book-entry.interface';

/**
 * 最小激活数服务
 * 保证至少激活N个条目
 * 
 * 降级策略：
 * 1. 扩展扫描深度（继续向历史消息延伸）
 * 2. 放宽匹配条件（全词→包含、敏感→不敏感）
 * 3. 激活常驻条目（constant=true）
 * 4. 按order激活（忽略关键词）
 */
@Injectable()
export class WorldBookMinActivationsService {
  private readonly logger = new Logger(WorldBookMinActivationsService.name);

  /**
   * 检查并确保最小激活数
   * @param currentActivated 当前激活的条目
   * @param allEntries 所有条目
   * @param minActivations 最小激活数
   * @returns 补充后的条目列表
   */
  ensureMinActivations(
    currentActivated: WorldBookEntry[],
    allEntries: WorldBookEntry[],
    minActivations: number,
  ): WorldBookEntry[] {
    if (currentActivated.length >= minActivations) {
      return currentActivated;
    }

    this.logger.warn(
      `当前激活数 ${currentActivated.length} < 最小激活数 ${minActivations}，启动降级策略`,
    );

    const needed = minActivations - currentActivated.length;
    const activatedUids = new Set(currentActivated.map((e) => e.uid));

    // 获取未激活的条目
    const unactivated = allEntries.filter(
      (e) => !activatedUids.has(e.uid) && !e.disable,
    );

    if (unactivated.length === 0) {
      this.logger.warn('没有可用的未激活条目');
      return currentActivated;
    }

    // 降级策略1：激活所有常驻条目
    const constants = unactivated.filter((e) => e.constant);
    if (constants.length > 0) {
      this.logger.debug(
        `[降级策略1] 激活 ${constants.length} 个常驻条目`,
      );

      const toAdd = constants.slice(0, needed);
      return [...currentActivated, ...toAdd];
    }

    // 降级策略2：按order激活（最重要的优先）
    const byOrder = [...unactivated].sort(
      (a, b) => (a.order || 100) - (b.order || 100),
    );

    const toAdd = byOrder.slice(0, needed);

    this.logger.debug(
      `[降级策略2] 按order激活 ${toAdd.length} 个条目`,
    );

    return [...currentActivated, ...toAdd];
  }

  /**
   * 判断是否需要扩展扫描深度
   * @param currentActivated 当前激活数
   * @param minActivations 最小激活数
   * @param currentDepth 当前扫描深度
   * @param maxDepth 最大允许深度
   * @returns 是否需要扩展
   */
  shouldExpandDepth(
    currentActivated: number,
    minActivations: number,
    currentDepth: number,
    maxDepth: number,
  ): boolean {
    return (
      currentActivated < minActivations &&
      currentDepth < maxDepth
    );
  }

  /**
   * 建议的下一个扫描深度
   * @param currentDepth 当前深度
   * @returns 建议深度
   */
  suggestNextDepth(currentDepth: number): number {
    // 每次扩展20
    return currentDepth + 20;
  }
}
