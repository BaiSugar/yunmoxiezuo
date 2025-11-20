import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBalancesService } from '../services/token-balances.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TOKEN_CONSUMPTION_PERMISSIONS } from '../../common/config/permissions.config';
import { User } from '../../users/entities/user.entity';
import { UserMembership } from '../../memberships/entities/user-membership.entity';

interface UserTokenInfo {
  id: number;
  username: string;
  email: string;
  totalTokens: number;
  usedTokens: number;
  frozenTokens: number;
  giftTokens: number;
  dailyFreeQuota: number;
  dailyUsedQuota: number;
  membership?: {
    planName: string;
    expiresAt: string;
    isActive: boolean;
  };
}

/**
 * 管理员字数余额控制器
 */
@ApiTags('管理员字数管理')
@Controller('api/v1/admin/token-balances')
@ApiBearerAuth()
export class AdminTokenBalancesController {
  constructor(
    private readonly balancesService: TokenBalancesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  @Get('users')
  @ApiOperation({ summary: '获取所有用户的字数信息（管理员）' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'minTokens', required: false, description: '最小字数', type: Number })
  @ApiQuery({ name: 'maxTokens', required: false, description: '最大字数', type: Number })
  @ApiQuery({ name: 'hasMembership', required: false, description: '是否有会员' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.VIEW_RECORDS)
  async getUsersTokenInfo(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('minTokens', new ParseIntPipe({ optional: true })) minTokens?: number,
    @Query('maxTokens', new ParseIntPipe({ optional: true })) maxTokens?: number,
    @Query('hasMembership') hasMembership?: string,
  ) {
    // 1. 构建用户查询
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.email']);

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('user.id', 'ASC');

    const [users, total] = await queryBuilder.getManyAndCount();

    // 2. 获取每个用户的字数余额和会员信息
    const usersWithTokenInfo: UserTokenInfo[] = await Promise.all(
      users.map(async (user) => {
        // 获取字数余额
        const balance = await this.balancesService.getBalance(user.id);

        // 获取活跃会员信息
        const membership = await this.membershipRepository
          .createQueryBuilder('membership')
          .leftJoinAndSelect('membership.plan', 'plan')
          .where('membership.userId = :userId', { userId: user.id })
          .andWhere('membership.isActive = :isActive', { isActive: true })
          .andWhere('membership.endDate > :now', { now: new Date() })
          .orderBy('membership.endDate', 'DESC')
          .getOne();

        const userInfo: UserTokenInfo = {
          id: user.id,
          username: user.username,
          email: user.email,
          totalTokens: balance.totalTokens,
          usedTokens: balance.usedTokens,
          frozenTokens: balance.frozenTokens,
          giftTokens: balance.giftTokens,
          dailyFreeQuota: balance.dailyFreeQuota || 0,
          dailyUsedQuota: balance.dailyUsedQuota || 0,
        };

        if (membership) {
          userInfo.membership = {
            planName: membership.plan?.name || '未知套餐',
            expiresAt: membership.endDate.toISOString().split('T')[0],
            isActive: true,
          };
        }

        return userInfo;
      }),
    );

    // 3. 应用筛选条件
    let filteredUsers = usersWithTokenInfo;

    // 筛选字数范围
    if (minTokens !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.totalTokens >= minTokens,
      );
    }
    if (maxTokens !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.totalTokens <= maxTokens,
      );
    }

    // 筛选会员状态
    if (hasMembership === 'true') {
      filteredUsers = filteredUsers.filter((user) => !!user.membership);
    } else if (hasMembership === 'false') {
      filteredUsers = filteredUsers.filter((user) => !user.membership);
    }

    return {
      success: true,
      data: {
        users: filteredUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取字数统计信息（管理员）' })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.VIEW_STATISTICS)
  async getTokenStatistics() {
    // 1. 总用户数
    const totalUsers = await this.userRepository.count();

    // 2. 总字数余额和已使用字数
    const balanceStats = await this.balancesService['balanceRepository']
      .createQueryBuilder('balance')
      .select('SUM(balance.totalTokens)', 'totalTokens')
      .addSelect('SUM(balance.usedTokens)', 'usedTokens')
      .getRawOne();

    // 3. 活跃会员用户数
    const membershipUsers = await this.membershipRepository
      .createQueryBuilder('membership')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('membership.endDate > :now', { now: new Date() })
      .distinctOn(['membership.userId'])
      .getCount();

    // 4. 今日消耗（从今日00:00开始）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsageResult = await this.balancesService[
      'consumptionRepository'
    ]
      .createQueryBuilder('consumption')
      .select('SUM(consumption.tokensUsed)', 'total')
      .where('consumption.createdAt >= :today', { today })
      .getRawOne();

    // 5. 本月消耗（从本月1日00:00开始）
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsageResult = await this.balancesService[
      'consumptionRepository'
    ]
      .createQueryBuilder('consumption')
      .select('SUM(consumption.tokensUsed)', 'total')
      .where('consumption.createdAt >= :firstDay', {
        firstDay: firstDayOfMonth,
      })
      .getRawOne();

    return {
      success: true,
      data: {
        totalUsers,
        totalTokens: parseInt(balanceStats?.totalTokens || '0'),
        totalUsedTokens: parseInt(balanceStats?.usedTokens || '0'),
        membershipUsers,
        dailyUsage: parseInt(dailyUsageResult?.total || '0'),
        monthlyUsage: parseInt(monthlyUsageResult?.total || '0'),
      },
    };
  }

  @Post('user/:userId/recharge')
  @ApiOperation({ summary: '为用户充值字数（管理员）' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: '充值金额（字数）' },
        isGift: { type: 'boolean', description: '是否赠送' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['amount', 'isGift'],
    },
  })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.ADMIN_MANAGE)
  async rechargeUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { amount: number; isGift: boolean; remark?: string },
  ) {
    const source = body.isGift ? 'admin_gift' : 'admin_recharge';
    const description = body.remark || `管理员${body.isGift ? '赠送' : '充值'}`;
    
    await this.balancesService.recharge(
      userId,
      body.amount,
      body.isGift,
      source,
      undefined,
      description,
    );

    return {
      success: true,
      message: `成功为用户充值 ${body.amount} 字数`,
    };
  }

  @Post('user/:userId/daily-quota')
  @ApiOperation({ summary: '设置用户每日免费额度（管理员）' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quota: { type: 'number', description: '每日免费额度' },
      },
      required: ['quota'],
    },
  })
  @RequirePermissions(TOKEN_CONSUMPTION_PERMISSIONS.ADMIN_MANAGE)
  async setUserDailyQuota(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { quota: number },
  ) {
    await this.balancesService.setDailyQuota(userId, body.quota);

    return {
      success: true,
      message: `成功设置用户每日免费额度为 ${body.quota}`,
    };
  }
}
