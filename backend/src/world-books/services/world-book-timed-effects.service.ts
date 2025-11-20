import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldBookActivation } from '../entities/world-book-activation.entity';
import { WorldBookEntry } from '../interfaces/world-book-entry.interface';

/**
 * 世界书时效性管理服务
 * 负责管理 sticky（粘性）、cooldown（冷却）、delay（延迟）
 */
@Injectable()
export class WorldBookTimedEffectsService {
  constructor(
    @InjectRepository(WorldBookActivation)
    private readonly activationRepo: Repository<WorldBookActivation>,
  ) {}

  /**
   * 获取激活状态
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @param entryUid 条目UID
   */
  async getActivationState(
    sessionId: string,
    promptId: number,
    entryUid: string,
  ): Promise<WorldBookActivation | null> {
    return await this.activationRepo.findOne({
      where: { sessionId, promptId, entryUid },
    });
  }

  /**
   * 检查粘性状态
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @param entryUid 条目UID
   * @returns 是否处于粘性状态
   */
  async isSticky(
    sessionId: string,
    promptId: number,
    entryUid: string,
  ): Promise<boolean> {
    const state = await this.getActivationState(sessionId, promptId, entryUid);
    return state ? state.stickyRemaining > 0 : false;
  }

  /**
   * 检查冷却状态
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @param entryUid 条目UID
   * @returns 是否处于冷却状态
   */
  async isCooldown(
    sessionId: string,
    promptId: number,
    entryUid: string,
  ): Promise<boolean> {
    const state = await this.getActivationState(sessionId, promptId, entryUid);
    return state ? state.cooldownRemaining > 0 : false;
  }

  /**
   * 检查延迟状态
   * @param entry 世界书条目
   * @param messageCount 当前消息数量
   * @returns 是否处于延迟状态
   */
  isDelay(entry: WorldBookEntry, messageCount: number): boolean {
    if (!entry.delay) {
      return false;
    }
    return messageCount < entry.delay;
  }

  /**
   * 设置激活状态
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @param entry 世界书条目
   * @param messageIndex 消息索引
   */
  async setActivationState(
    sessionId: string,
    promptId: number,
    entry: WorldBookEntry,
    messageIndex: number,
  ): Promise<void> {
    let state = await this.getActivationState(sessionId, promptId, entry.uid);

    if (!state) {
      // 创建新的激活状态
      state = this.activationRepo.create({
        sessionId,
        promptId,
        entryUid: entry.uid,
      });
    }

    // 更新激活时间和消息索引
    state.lastActivatedAt = new Date();
    state.lastActivatedMessageIndex = messageIndex;

    // 设置粘性
    if (entry.sticky) {
      state.stickyRemaining = entry.sticky;
    }

    // 设置冷却
    if (entry.cooldown) {
      state.cooldownRemaining = entry.cooldown;
    }

    await this.activationRepo.save(state);
  }

  /**
   * 减少粘性计数
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @param entryUid 条目UID
   */
  async decrementSticky(
    sessionId: string,
    promptId: number,
    entryUid: string,
  ): Promise<void> {
    const state = await this.getActivationState(sessionId, promptId, entryUid);

    if (state && state.stickyRemaining > 0) {
      state.stickyRemaining--;
      await this.activationRepo.save(state);
    }
  }

  /**
   * 减少冷却计数
   * @param sessionId 会话ID
   * @param promptId 提示词ID
   * @param entryUid 条目UID
   */
  async decrementCooldown(
    sessionId: string,
    promptId: number,
    entryUid: string,
  ): Promise<void> {
    const state = await this.getActivationState(sessionId, promptId, entryUid);

    if (state && state.cooldownRemaining > 0) {
      state.cooldownRemaining--;
      await this.activationRepo.save(state);
    }
  }

  /**
   * 批量减少冷却计数（优化性能）
   * @param states 激活状态列表
   */
  async batchDecrementCooldown(
    states: Array<{
      sessionId: string;
      promptId: number;
      entryUid: string;
    }>,
  ): Promise<void> {
    if (states.length === 0) return;

    // 使用批量更新
    await this.activationRepo
      .createQueryBuilder()
      .update(WorldBookActivation)
      .set({
        cooldownRemaining: () => 'GREATEST(cooldown_remaining - 1, 0)',
      })
      .where('cooldown_remaining > 0')
      .andWhere(
        states
          .map(
            (_, index) =>
              `(session_id = :sessionId${index} AND prompt_id = :promptId${index} AND entry_uid = :entryUid${index})`,
          )
          .join(' OR '),
        states.reduce((params, state, index) => {
          params[`sessionId${index}`] = state.sessionId;
          params[`promptId${index}`] = state.promptId;
          params[`entryUid${index}`] = state.entryUid;
          return params;
        }, {}),
      )
      .execute();
  }

  /**
   * 清理会话的所有激活状态
   * @param sessionId 会话ID
   */
  async clearSession(sessionId: string): Promise<void> {
    await this.activationRepo.delete({ sessionId });
  }
}
