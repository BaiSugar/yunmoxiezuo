import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RedemptionCode } from '../entities/redemption-code.entity';
import { RedemptionRecord } from '../entities/redemption-record.entity';
import { UserMembershipsService } from '../../memberships/services/user-memberships.service';
import { TokenBalancesService } from '../../token-balances/services/token-balances.service';
import { MembershipSource } from '../../memberships/enums/membership-source.enum';
import { CodeType } from '../enums/code-type.enum';

/**
 * 卡密兑换服务
 */
@Injectable()
export class CodeRedemptionService {
  constructor(
    @InjectRepository(RedemptionCode)
    private readonly codeRepository: Repository<RedemptionCode>,
    @InjectRepository(RedemptionRecord)
    private readonly recordRepository: Repository<RedemptionRecord>,
    private readonly membershipsService: UserMembershipsService,
    private readonly tokenBalancesService: TokenBalancesService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 兑换卡密
   */
  async redeem(
    code: string,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    membershipId?: number;
    tokenAmount: number;
    message: string;
  }> {
    // 先在事务外查询和验证卡密
    const redemptionCode = await this.dataSource.manager.findOne(RedemptionCode, {
      where: { code },
      relations: ['membershipPlan'],
    });

    if (!redemptionCode) {
      throw new BadRequestException('卡密不存在');
    }

    // 验证卡密状态
    this.validateCode(redemptionCode);

    // 检查用户是否已使用
    const existingRecord = await this.dataSource.manager.findOne(RedemptionRecord, {
      where: { codeId: redemptionCode.id, userId },
    });

    if (existingRecord) {
      throw new BadRequestException('该卡密您已使用过，每个账号仅限使用一次');
    }

    // 检查总使用次数
    if (redemptionCode.maxUseCount !== -1) {
      if (redemptionCode.usedCount >= redemptionCode.maxUseCount) {
        throw new BadRequestException('卡密已达到最大使用次数');
      }
    }

    let membershipId: number | undefined;
    let tokenAmount = 0;
    const messages: string[] = [];

    // 先执行兑换操作（在事务外）
    if (
      redemptionCode.type === CodeType.MEMBERSHIP ||
      redemptionCode.type === CodeType.MIXED
    ) {
      const membership = await this.membershipsService.activate(
        userId,
        redemptionCode.membershipPlanId,
        MembershipSource.REDEEM,
        redemptionCode.id,
        undefined,
      );
      membershipId = membership.id;
      messages.push(`获得会员：${redemptionCode.membershipPlan.name}`);
    }

    if (
      (redemptionCode.type === CodeType.TOKEN || redemptionCode.type === CodeType.MIXED) &&
      redemptionCode.tokenAmount > 0
    ) {
      await this.tokenBalancesService.recharge(
        userId,
        Number(redemptionCode.tokenAmount),
        true,
        'redeem',
        redemptionCode.id,
        `兑换卡密：${code}`,
      );
      tokenAmount = Number(redemptionCode.tokenAmount);
      messages.push(`获得字数：${tokenAmount.toLocaleString()}`);
    }

    // 最后在事务中更新卡密使用记录
    await this.dataSource.transaction(async (manager) => {
      // 重新查询卡密（带锁，防止并发）
      const codeToUpdate = await manager.findOne(RedemptionCode, {
        where: { code },
        lock: { mode: 'pessimistic_write' },
      });

      if (!codeToUpdate) {
        throw new BadRequestException('卡密不存在');
      }

      // 更新使用次数
      codeToUpdate.usedCount += 1;
      await manager.save(codeToUpdate);

      // 记录使用
      const record = manager.create(RedemptionRecord, {
        codeId: redemptionCode.id,
        codeStr: code,
        userId,
        membershipId,
        tokenAmount,
        ipAddress,
        userAgent,
      });
      await manager.save(record);
    });

    return {
      membershipId,
      tokenAmount,
      message: messages.join('，'),
    };
  }

  /**
   * 验证卡密
   */
  private validateCode(code: RedemptionCode): void {
    if (!code.isActive) {
      throw new BadRequestException('卡密已停用');
    }

    const now = new Date();

    if (code.validFrom && code.validFrom > now) {
      throw new BadRequestException('卡密尚未生效');
    }

    if (code.validTo && code.validTo < now) {
      throw new BadRequestException('卡密已过期');
    }
  }
}
