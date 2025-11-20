import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenBalancesService } from '../services/token-balances.service';

/**
 * 每日额度重置定时任务
 */
@Injectable()
export class DailyQuotaResetTask {
  private readonly logger = new Logger(DailyQuotaResetTask.name);

  constructor(
    private readonly balancesService: TokenBalancesService,
  ) {}

  /**
   * 每天凌晨00:00重置所有用户的每日免费额度
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Shanghai',
  })
  async resetAllQuotas() {
    const startTime = Date.now();
    this.logger.log('===== 开始执行每日免费额度重置任务 =====');

    try {
      const affected = await this.balancesService.resetAllDailyQuotas();
      const duration = Date.now() - startTime;
      
      this.logger.log(`每日免费额度重置完成`);
      this.logger.log(`- 影响用户数: ${affected}`);
      this.logger.log(`- 执行时间: ${duration}ms`);
      this.logger.log('==========================================');
      
      return { affected, duration };
    } catch (error) {
      this.logger.error(`每日免费额度重置失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 手动触发重置（用于测试）
   */
  async manualReset() {
    this.logger.log('手动触发每日免费额度重置');
    return await this.balancesService.resetAllDailyQuotas();
  }
}
