import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TokenConsumptionRecord, ConsumptionSource } from '../entities/token-consumption-record.entity';
import { UserTokenBalance } from '../entities/user-token-balance.entity';
import { TokenTransaction } from '../entities/token-transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { AiModel } from '../../ai-models/entities/ai-model.entity';
import { UserMembership } from '../../memberships/entities/user-membership.entity';
import { MembershipPlan } from '../../memberships/entities/membership-plan.entity';
import { ConsumptionParamsDto, ConsumptionResultDto, ConsumptionStatsDto } from '../dto/consumption.dto';
import { TokenBalancesService } from './token-balances.service';

/**
 * 字数消耗计算服务
 */
@Injectable()
export class TokenConsumptionService {
  private readonly logger = new Logger(TokenConsumptionService.name);

  constructor(
    @InjectRepository(TokenConsumptionRecord)
    private readonly recordRepository: Repository<TokenConsumptionRecord>,
    @InjectRepository(UserTokenBalance)
    private readonly balanceRepository: Repository<UserTokenBalance>,
    @InjectRepository(AiModel)
    private readonly modelRepository: Repository<AiModel>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
    @InjectRepository(MembershipPlan)
    private readonly planRepository: Repository<MembershipPlan>,
    private readonly dataSource: DataSource,
    private readonly balancesService: TokenBalancesService,
  ) {}

  /**
   * 计算并消耗字数（核心方法）
   */
  async calculateAndConsume(params: ConsumptionParamsDto): Promise<ConsumptionResultDto> {

    return await this.dataSource.transaction(async (manager) => {
      // 1. 加载模型配置
      const model = await manager.findOne(AiModel, { 
        where: { id: params.modelId } 
      });
      if (!model) {
        throw new BadRequestException('模型不存在');
      }
      
      // 2. 免费模型直接跳过
      if (model.isFree) {
        const balance = await manager.findOne(UserTokenBalance, {
          where: { userId: params.userId }
        });
        return this.buildSuccessResult(0, 0, 0, 0, 0, false, balance || undefined);
      }

      // 3. 倍率为0的模型：只校验余额>0
      if (model.inputRatio === 0 && model.outputRatio === 0) {
        const balance = await manager.findOne(UserTokenBalance, {
          where: { userId: params.userId }
        });
        if (!balance || balance.totalTokens <= 0) {
          throw new BadRequestException('账户余额必须大于0');
        }
        return this.buildSuccessResult(0, 0, 0, 0, 0, false, balance || undefined);
      }

      // 4. 获取用户会员信息
      const membership = await this.getActiveMembership(params.userId, manager);
      const memberPlan = membership ? await manager.findOne(MembershipPlan, {
        where: { id: membership.planId }
      }) : null;

      // 5. 计算消耗
      const calculation = this.calculateCost(
        model,
        params.inputChars,
        params.outputChars,
        memberPlan,
      );

      // 6. 加载余额（使用事务内的manager查询，确保数据一致性）
      const balance = await manager.findOne(UserTokenBalance, {
        where: { userId: params.userId },
        lock: { mode: 'pessimistic_write' }  // 悲观锁，防止并发问题
      });
      
      if (!balance) {
        throw new BadRequestException('用户余额记录不存在');
      }
      
      // 注意：每日免费额度由定时任务在零点统一重置（DailyQuotaResetTask）
      // 这里不再主动检查重置，避免重复处理

      // 7. 检查余额是否足够（优先级：每日免费 > 其他余额）
      const availableDailyFree = balance.dailyFreeQuota - balance.dailyUsedQuota;
      const availableGift = Number(balance.giftTokens) || 0;
      // 可用付费字数 = 总字数 - 赠送字数 - 冻结字数
      const availablePaid = Math.max(0, Number(balance.totalTokens) - availableGift - Number(balance.frozenTokens));
      // 其他余额 = 赠送字数 + 付费字数（混合使用，不区分优先级）
      const availableOther = availableGift + availablePaid;
      const totalAvailable = availableDailyFree + availableOther;

      if (totalAvailable < calculation.totalCost) {
        throw new BadRequestException(
          `字数余额不足。需要${calculation.totalCost}字，可用${totalAvailable}字（免费:${availableDailyFree}, 其他:${availableOther}）`
        );
      }

      // 8. 分配扣费（优先级：每日免费 > 其他余额）
      let usedDailyFree = 0;
      let usedOther = 0; // 混合使用赠送和付费字数
      let remaining = calculation.totalCost;

      // 第一步：优先扣除每日免费额度（必须先用完）
      if (availableDailyFree > 0 && remaining > 0) {
        usedDailyFree = Math.min(availableDailyFree, remaining);
        remaining -= usedDailyFree;
      }

      // 第二步：剩余部分从其他余额扣除（赠送+付费混合）
      if (remaining > 0) {
        usedOther = Math.min(availableOther, remaining);
        remaining -= usedOther;
      }

      // 计算赠送和付费字数的使用量（用于记录）
      const usedGift = Math.min(availableGift, usedOther);
      const usedPaid = usedOther - usedGift;

      // 9. 执行扣费
      // 保存扣费前的余额（用于流水记录）
      const balanceBefore = Number(balance.totalTokens);
      
      const beforeDailyUsed = Number(balance.dailyUsedQuota) || 0;
      balance.dailyUsedQuota = beforeDailyUsed + usedDailyFree;
      
      this.logger.debug(
        `扣除每日免费额度 - 用户: ${params.userId}, ` +
        `扣除前: ${beforeDailyUsed}, 本次扣除: ${usedDailyFree}, ` +
        `扣除后: ${balance.dailyUsedQuota}`
      );
      
      // 扣除其他余额（赠送+付费混合）
      // 先扣赠送，再扣付费
      if (usedGift > 0) {
        balance.giftTokens = Math.max(0, Number(balance.giftTokens) - usedGift);
        balance.totalTokens = Math.max(0, Number(balance.totalTokens) - usedGift);
      }
      
      if (usedPaid > 0) {
        balance.totalTokens = Math.max(0, Number(balance.totalTokens) - usedPaid);
      }
      
      // 更新累计消耗（所有消耗都计入，包括免费、赠送和付费）
      const totalConsumed = usedDailyFree + usedGift + usedPaid;
      if (totalConsumed > 0) {
        balance.usedTokens = Number(balance.usedTokens) + totalConsumed;
      }
      
      balance.lastConsumedAt = new Date();

      await manager.save(balance);

      // 10. 记录消耗明细
      const record = manager.create(TokenConsumptionRecord, {
        userId: params.userId,
        modelId: params.modelId,
        inputChars: params.inputChars,
        outputChars: params.outputChars,
        inputRatio: model.inputRatio,
        outputRatio: model.outputRatio,
        calculatedInputCost: calculation.inputCost,
        calculatedOutputCost: calculation.outputCost,
        totalCost: calculation.totalCost,
        usedDailyFree,
        // usedGift 字段暂未添加到实体，先合并到 usedPaid 中记录
        // 实际扣费时已正确扣除 giftTokens
        usedPaid: usedPaid + usedGift,
        isMember: !!memberPlan,
        memberFreeInput: calculation.memberFreeInput,
        source: params.source,
        relatedId: params.relatedId,
      });
      await manager.save(record);

      this.logger.log(`消耗完成 - 每日免费:${usedDailyFree}, 赠送:${usedGift}, 付费:${usedPaid}`);

      // 11. 创建流水记录（所有消耗都创建流水，方便用户查看完整历史）
      const totalConsumedAmount = usedDailyFree + usedGift + usedPaid;
      if (totalConsumedAmount > 0) {
        // 构建详细备注
        const consumptionDetails: string[] = [];
        if (usedDailyFree > 0) consumptionDetails.push(`每日免费${usedDailyFree}字`);
        if (usedGift > 0) consumptionDetails.push(`赠送${usedGift}字`);
        if (usedPaid > 0) consumptionDetails.push(`付费${usedPaid}字`);
        
        const remark = `AI生成消耗: 输入${params.inputChars}字，输出${params.outputChars}字 (${consumptionDetails.join(' + ')})`;
        
        const transaction = manager.create(TokenTransaction, {
          userId: params.userId,
          type: TransactionType.CONSUME,
          amount: -totalConsumedAmount,  // 记录总消耗
          balanceBefore,
          balanceAfter: Number(balance.totalTokens),
          source: params.source,
          relatedId: params.relatedId,
          modelName: model.displayName,
          remark,
        });
        await manager.save(transaction);
        
        this.logger.debug(
          `流水记录已创建 - 用户: ${params.userId}, 总消耗: ${totalConsumedAmount}字`
        );
      }

      // 重新查询余额以获取最新状态（用于返回值）
      const updatedBalance = await manager.findOne(UserTokenBalance, {
        where: { userId: params.userId }
      });

      return this.buildSuccessResult(
        calculation.totalCost,
        calculation.inputCost,
        calculation.outputCost,
        usedDailyFree,
        usedPaid, // 只返回真正的付费字数（不包含赠送字数）
        !!memberPlan && calculation.memberBenefitApplied,
        updatedBalance || undefined,
      );
    });
  }

  /**
   * 计算消耗（核心算法）
   */
  private calculateCost(
    model: AiModel,
    inputChars: number,
    outputChars: number,
    memberPlan: MembershipPlan | null,
  ): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    memberFreeInput: number;
    memberBenefitApplied: boolean;
  } {
    let inputCost = 0;
    let outputCost = 0;
    let memberFreeInput = 0;
    let memberBenefitApplied = false;

    // 1. 计算输入消耗
    if (inputChars >= model.minInputChars && model.inputRatio > 0) {
      inputCost = Math.ceil(inputChars / model.inputRatio);
    }

    // 2. 计算输出消耗
    if (model.outputRatio > 0) {
      outputCost = Math.ceil(outputChars / model.outputRatio);
    }

    // 3. 应用会员特权
    if (memberPlan) {
      // 会员输出免费
      if (memberPlan.outputFree) {
        outputCost = 0;
        memberBenefitApplied = true;
      }

      // 会员输入部分免费
      if (memberPlan.freeInputCharsPerRequest > 0 && inputChars > 0) {
        const freeInputChars = Math.min(
          inputChars,
          memberPlan.freeInputCharsPerRequest
        );
        const freeInputCost = Math.ceil(freeInputChars / model.inputRatio);
        
        inputCost = Math.max(0, inputCost - freeInputCost);
        memberFreeInput = freeInputChars;
        memberBenefitApplied = true;
      }
    }

    const totalCost = inputCost + outputCost;

    return {
      inputCost,
      outputCost,
      totalCost,
      memberFreeInput,
      memberBenefitApplied,
    };
  }

  /**
   * 检查并重置每日免费额度
   */
  private async checkAndResetDailyQuota(
    balance: UserTokenBalance,
    manager: any,
  ): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const resetDate = balance.quotaResetDate 
      ? new Date(balance.quotaResetDate) 
      : null;

    // 将重置日期也标准化为当天 00:00:00
    const resetDateNormalized = resetDate 
      ? new Date(resetDate.getFullYear(), resetDate.getMonth(), resetDate.getDate())
      : null;

    // 如果重置日期不是今天，则重置（使用标准化的日期比较）
    if (!resetDateNormalized || resetDateNormalized.getTime() < today.getTime()) {
      this.logger.debug(
        `重置每日免费额度 - 用户: ${balance.userId}, ` +
        `上次重置: ${resetDateNormalized?.toISOString() || 'null'}, ` +
        `今天: ${today.toISOString()}, ` +
        `重置前已用: ${balance.dailyUsedQuota}`
      );
      
      balance.dailyUsedQuota = 0;
      balance.quotaResetDate = today;
      await manager.save(balance);
      
      this.logger.log(`每日免费额度已重置 - 用户: ${balance.userId}`);
    }
  }

  /**
   * 获取用户活跃会员
   */
  private async getActiveMembership(
    userId: number,
    manager: any,
  ): Promise<UserMembership | null> {
    const now = new Date();
    
    const membership = await manager.findOne(UserMembership, {
      where: {
        userId,
        isActive: true,
      },
    });

    // 二次确认：检查会员是否真的有效
    if (membership) {
      // 如果有结束时间且已过期，返回 null
      if (membership.endDate && new Date(membership.endDate) < now) {
        return null;
      }
      // 如果有开始时间且尚未开始，返回 null
      if (membership.startDate && new Date(membership.startDate) > now) {
        return null;
      }
    }

    return membership;
  }

  /**
   * 构建成功结果
   */
  private buildSuccessResult(
    totalCost: number,
    inputCost: number,
    outputCost: number,
    usedDailyFree: number,
    usedPaid: number,
    memberBenefitApplied: boolean,
    balance?: UserTokenBalance,
  ): ConsumptionResultDto {
    // 计算剩余余额
    const remainingBalance = balance 
      ? Math.max(0, Number(balance.totalTokens) - Number(balance.frozenTokens))
      : 0;
    const remainingDailyFree = balance
      ? Math.max(0, balance.dailyFreeQuota - balance.dailyUsedQuota)
      : 0;

    return {
      success: true,
      totalCost,
      inputCost,
      outputCost,
      usedDailyFree,
      usedPaid,
      memberBenefitApplied,
      remainingBalance,
      remainingDailyFree,
    };
  }

  /**
   * 预估消耗（不执行扣费）
   */
  async estimateCost(
    modelId: number,
    inputChars: number,
    outputChars: number,
    userId: number,
  ): Promise<number> {
    const model = await this.modelRepository.findOne({ where: { id: modelId } });
    if (!model) {
      throw new BadRequestException('模型不存在');
    }

    if (model.isFree || (model.inputRatio === 0 && model.outputRatio === 0)) {
      return 0;
    }

    const membership = await this.getActiveMembership(userId, this.dataSource.manager);
    const memberPlan = membership 
      ? await this.planRepository.findOne({ where: { id: membership.planId } })
      : null;

    const calculation = this.calculateCost(model, inputChars, outputChars, memberPlan);
    return calculation.totalCost;
  }

  /**
   * 检查余额是否足够（仅检查，不触发重置）
   * 注意：此方法仅用于预检查，不会触发每日额度重置
   * 实际的重置和扣费在 calculateAndConsume 中的事务里统一处理
   */
  async checkBalance(userId: number, estimatedCost: number): Promise<boolean> {
    const balance = await this.balancesService.getBalance(userId);

    // 获取当前可用额度（不重置，只读取）
    const availableDailyFree = Math.max(0, balance.dailyFreeQuota - balance.dailyUsedQuota);
    const availableGift = Number(balance.giftTokens) || 0;
    const availablePaid = Math.max(0, Number(balance.totalTokens) - availableGift - Number(balance.frozenTokens));
    const availableOther = availableGift + availablePaid;
    const totalAvailable = availableDailyFree + availableOther;

    this.logger.debug(
      `余额检查 - 用户: ${userId}, 需要: ${estimatedCost}, ` +
      `可用: ${totalAvailable} (免费: ${availableDailyFree}, 其他: ${availableOther})`
    );

    return totalAvailable >= estimatedCost;
  }

  /**
   * 查询消耗记录（分页）
   */
  async findAndCount(options: any): Promise<[TokenConsumptionRecord[], number]> {
    return await this.recordRepository.findAndCount(options);
  }

  /**
   * 查询消耗统计
   */
  async getStatistics(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<ConsumptionStatsDto> {
    const qb = this.recordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId });

    if (startDate) {
      qb.andWhere('record.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('record.createdAt <= :endDate', { endDate });
    }

    // 统计总消耗
    const totalStats = await qb
      .select('SUM(record.totalCost)', 'totalConsumed')
      .addSelect('SUM(record.inputChars)', 'totalInputChars')
      .addSelect('SUM(record.outputChars)', 'totalOutputChars')
      .addSelect('SUM(record.usedDailyFree)', 'totalDailyFreeUsed')
      .addSelect('SUM(record.usedPaid)', 'totalPaidUsed')
      .addSelect('COUNT(*)', 'requestCount')
      .getRawOne();

    // 按来源统计
    const bySourceStats = await qb
      .select('record.source', 'source')
      .addSelect('SUM(record.totalCost)', 'total')
      .groupBy('record.source')
      .getRawMany();

    const bySource: Record<string, number> = {};
    bySourceStats.forEach((item) => {
      bySource[item.source] = parseInt(item.total) || 0;
    });

    return {
      totalConsumed: parseInt(totalStats.totalConsumed) || 0,
      totalInputChars: parseInt(totalStats.totalInputChars) || 0,
      totalOutputChars: parseInt(totalStats.totalOutputChars) || 0,
      totalDailyFreeUsed: parseInt(totalStats.totalDailyFreeUsed) || 0,
      totalPaidUsed: parseInt(totalStats.totalPaidUsed) || 0,
      requestCount: parseInt(totalStats.requestCount) || 0,
      bySource,
    };
  }

  /**
   * 查询消耗记录（带分页和筛选）
   */
  async getConsumptionRecords(
    userId: number,
    filters: { source?: string; startDate?: string; endDate?: string },
    page: number = 1,
    limit: number = 20,
  ) {
    const qb = this.recordRepository
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId });

    if (filters.source) {
      qb.andWhere('record.source = :source', { source: filters.source });
    }

    if (filters.startDate) {
      qb.andWhere('record.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('record.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const [data, total] = await qb
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询消耗统计（封装方法）
   */
  async getConsumptionStatistics(
    userId: number,
    startDate?: string,
    endDate?: string,
  ) {
    return this.getStatistics(userId, startDate, endDate);
  }
}
