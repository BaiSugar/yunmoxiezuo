import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserTokenBalance } from '../entities/user-token-balance.entity';
import { TokenTransaction } from '../entities/token-transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';

/**
 * 字数余额服务
 */
@Injectable()
export class TokenBalancesService {
  constructor(
    @InjectRepository(UserTokenBalance)
    private readonly balanceRepository: Repository<UserTokenBalance>,
    @InjectRepository(TokenTransaction)
    private readonly transactionRepository: Repository<TokenTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 获取或创建用户余额记录
   */
  async getOrCreateBalance(userId: number): Promise<UserTokenBalance> {
    let balance = await this.balanceRepository.findOne({ where: { userId } });

    if (!balance) {
      balance = this.balanceRepository.create({
        userId,
        totalTokens: 0,
        usedTokens: 0,
        giftTokens: 0,
        frozenTokens: 0,
      });
      await this.balanceRepository.save(balance);
    }

    return balance;
  }

  /**
   * 充值字数（事务）
   */
  async recharge(
    userId: number,
    amount: number,
    isGift: boolean,
    source: string,
    relatedId?: number,
    remark?: string,
  ): Promise<UserTokenBalance> {
    if (amount <= 0) {
      throw new BadRequestException('充值数量必须大于0');
    }

    return await this.dataSource.transaction(async (manager) => {
      const balance = await manager.findOne(UserTokenBalance, { where: { userId } });
      if (!balance) throw new NotFoundException('用户余额记录不存在');

      const balanceBefore = Number(balance.totalTokens);
      balance.totalTokens = Number(balance.totalTokens) + amount;

      if (isGift) {
        balance.giftTokens = Number(balance.giftTokens) + amount;
      }

      await manager.save(balance);

      // 记录流水
      const transaction = manager.create(TokenTransaction, {
        userId,
        type: isGift ? TransactionType.GIFT : TransactionType.RECHARGE,
        amount,
        balanceBefore,
        balanceAfter: Number(balance.totalTokens),
        source,
        relatedId,
        remark,
      });
      await manager.save(transaction);

      return balance;
    });
  }

  /**
   * 消费字数（事务）
   */
  async consume(
    userId: number,
    amount: number,
    modelName: string,
    source: string,
    relatedId?: number,
  ): Promise<UserTokenBalance> {
    if (amount <= 0) {
      throw new BadRequestException('消费数量必须大于0');
    }

    return await this.dataSource.transaction(async (manager) => {
      const balance = await manager.findOne(UserTokenBalance, { where: { userId } });
      if (!balance) throw new NotFoundException('用户余额记录不存在');

      const availableTokens = Number(balance.totalTokens) - Number(balance.frozenTokens);
      if (availableTokens < amount) {
        throw new BadRequestException('字数余额不足');
      }

      const balanceBefore = Number(balance.totalTokens);

      // 扣费优先级：赠送字数 -> 购买字数
      if (balance.giftTokens > 0) {
        const deductFromGift = Math.min(Number(balance.giftTokens), amount);
        balance.giftTokens = Number(balance.giftTokens) - deductFromGift;
      }

      balance.totalTokens = Number(balance.totalTokens) - amount;
      balance.usedTokens = Number(balance.usedTokens) + amount;
      balance.lastConsumedAt = new Date();

      await manager.save(balance);

      // 记录流水
      const transaction = manager.create(TokenTransaction, {
        userId,
        type: TransactionType.CONSUME,
        amount: -amount,
        balanceBefore,
        balanceAfter: Number(balance.totalTokens),
        source,
        relatedId,
        modelName,
      });
      await manager.save(transaction);

      return balance;
    });
  }

  /**
   * 退款字数（事务）
   */
  async refund(
    userId: number,
    amount: number,
    source: string,
    relatedId?: number,
    remark?: string,
  ): Promise<UserTokenBalance> {
    if (amount <= 0) {
      throw new BadRequestException('退款数量必须大于0');
    }

    return await this.dataSource.transaction(async (manager) => {
      const balance = await manager.findOne(UserTokenBalance, { where: { userId } });
      if (!balance) throw new NotFoundException('用户余额记录不存在');

      const balanceBefore = Number(balance.totalTokens);
      balance.totalTokens = Number(balance.totalTokens) + amount;

      if (balance.usedTokens >= amount) {
        balance.usedTokens = Number(balance.usedTokens) - amount;
      }

      await manager.save(balance);

      // 记录流水
      const transaction = manager.create(TokenTransaction, {
        userId,
        type: TransactionType.REFUND,
        amount,
        balanceBefore,
        balanceAfter: Number(balance.totalTokens),
        source,
        relatedId,
        remark,
      });
      await manager.save(transaction);

      return balance;
    });
  }

  /**
   * 查询余额（带自动初始化逻辑）
   */
  async getBalance(userId: number): Promise<UserTokenBalance> {
    const balance = await this.getOrCreateBalance(userId);

    // 🎁 兜底逻辑：为老用户补发初始额度
    // 如果余额记录存在但总字数为0且没有消费记录，说明是老用户或数据异常
    if (
      balance.totalTokens === 0 &&
      balance.giftTokens === 0 &&
      balance.usedTokens === 0
    ) {
      try {
        // 检查是否已有充值记录（防止重复赠送）
        const hasTransaction = await this.dataSource
          .getRepository(TokenTransaction)
          .findOne({
            where: { userId, type: TransactionType.GIFT },
          });

        if (!hasTransaction) {
          console.log(`🎁 为老用户 ${userId} 补发初始奖励...`);

          // 赠送50万字数
          await this.recharge(
            userId,
            500000,
            true,
            'auto_init',
            undefined,
            '系统自动补发 - 新用户初始奖励',
          );

          // 设置每日免费1万字数
          if (!balance.dailyFreeQuota || balance.dailyFreeQuota === 0) {
            await this.setDailyQuota(userId, 10000);
          }

          // 重新查询余额
          const updatedBalance = await this.balanceRepository.findOne({ where: { userId } });
          if (updatedBalance) {
            return updatedBalance;
          }
        }
      } catch (error) {
        // 补发失败不影响查询余额
        console.error(`补发初始奖励失败 (用户 ${userId}):`, error.message);
      }
    }

    // 确保每日免费额度已设置
    if (!balance.dailyFreeQuota || balance.dailyFreeQuota === 0) {
      try {
        await this.setDailyQuota(userId, 10000);
        balance.dailyFreeQuota = 10000;
      } catch (error) {
        console.error(`设置每日免费额度失败 (用户 ${userId}):`, error.message);
      }
    }

    return balance;
  }

  /**
   * 查询流水记录
   */
  async getTransactions(
    userId: number,
    type?: TransactionType,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = { userId };
    if (type) where.type = type;

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取每日免费额度信息
   */
  async getDailyQuotaInfo(userId: number): Promise<{
    dailyFreeQuota: number;
    dailyUsedQuota: number;
    dailyRemainingQuota: number;
    quotaResetDate: Date;
  }> {
    const balance = await this.getOrCreateBalance(userId);
    
    return {
      dailyFreeQuota: Number(balance.dailyFreeQuota),
      dailyUsedQuota: Number(balance.dailyUsedQuota),
      dailyRemainingQuota: Math.max(0, Number(balance.dailyFreeQuota) - Number(balance.dailyUsedQuota)),
      quotaResetDate: balance.quotaResetDate || new Date(),
    };
  }

  /**
   * 设置每日免费额度
   */
  async setDailyQuota(userId: number, quota: number): Promise<void> {
    const balance = await this.getOrCreateBalance(userId);
    balance.dailyFreeQuota = quota;
    balance.quotaResetDate = new Date();
    balance.quotaResetDate.setHours(0, 0, 0, 0);
    await this.balanceRepository.save(balance);
  }

  /**
   * 重置每日免费额度（由定时任务调用）
   */
  async resetDailyQuota(userId: number): Promise<void> {
    const balance = await this.balanceRepository.findOne({ where: { userId } });
    if (balance) {
      balance.dailyUsedQuota = 0;
      balance.quotaResetDate = new Date();
      balance.quotaResetDate.setHours(0, 0, 0, 0);
      await this.balanceRepository.save(balance);
    }
  }

  /**
   * 批量重置所有用户的每日免费额度
   */
  async resetAllDailyQuotas(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.balanceRepository
      .createQueryBuilder()
      .update(UserTokenBalance)
      .set({
        dailyUsedQuota: 0,
        quotaResetDate: today,
      })
      .execute();

    return result.affected || 0;
  }
}
