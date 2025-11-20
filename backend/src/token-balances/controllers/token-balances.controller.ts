import { Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TokenBalancesService } from '../services/token-balances.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionType } from '../enums/transaction-type.enum';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TOKEN_CONSUMPTION_PERMISSIONS } from '../../common/config/permissions.config';
import { TokenConsumptionService } from '../services/token-consumption.service';

/**
 * 字数余额控制器
 */
@ApiTags('字数余额')
@Controller('api/v1/token-balances')
@ApiBearerAuth()
export class TokenBalancesController {
  constructor(
    private readonly balancesService: TokenBalancesService,
    private readonly consumptionService: TokenConsumptionService,
  ) {}

  // ⚠️ 重要：具体路径必须在通用路径 @Get() 之前，否则会被拦截

  @Get('user/:userId')
  @ApiOperation({ summary: '查询指定用户余额（管理员）' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.VIEW_RECORDS)
  getUserBalance(@Param('userId', ParseIntPipe) userId: number) {
    return this.balancesService.getBalance(userId);
  }

  @Get('daily-quota')
  @ApiOperation({ summary: '查询每日免费额度' })
  getDailyQuota(@CurrentUser('id') userId: number) {
    return this.balancesService.getDailyQuotaInfo(userId);
  }

  @Get('consumptions')
  @ApiOperation({ summary: '查询消耗记录' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.VIEW_RECORDS)
  async getConsumptions(
    @CurrentUser('id') userId: number,
    @Query('source') source?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.consumptionService.getConsumptionRecords(
      userId,
      { source, startDate, endDate },
      page,
      limit,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: '查询消耗统计' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.VIEW_STATISTICS)
  async getStatistics(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.consumptionService.getConsumptionStatistics(
      userId,
      startDate,
      endDate,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: '查询字数流水' })
  getTransactions(
    @CurrentUser('id') userId: number,
    @Query('type') type?: TransactionType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.balancesService.getTransactions(userId, type, page, limit);
  }

  @Get()
  @ApiOperation({ summary: '查询用户余额' })
  getBalance(@CurrentUser('id') userId: number) {
    return this.balancesService.getBalance(userId);
  }

  @Post('admin/reset-daily-quota/:userId')
  @ApiOperation({ summary: '重置指定用户的每日免费额度（管理员）' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.RESET_QUOTA)
  async resetUserDailyQuota(@Param('userId', ParseIntPipe) userId: number) {
    await this.balancesService.resetDailyQuota(userId);
    return {
      success: true,
      message: `用户 ${userId} 的每日免费额度已重置`,
    };
  }

  @Post('admin/reset-all-daily-quotas')
  @ApiOperation({ summary: '批量重置所有用户的每日免费额度（管理员）' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.RESET_QUOTA)
  async resetAllDailyQuotas() {
    const affected = await this.balancesService.resetAllDailyQuotas();
    return {
      success: true,
      message: `已重置 ${affected} 个用户的每日免费额度`,
      affected,
    };
  }
}
