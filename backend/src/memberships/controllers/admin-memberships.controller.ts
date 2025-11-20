import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMembershipsService } from '../services/user-memberships.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { MEMBERSHIP_PERMISSIONS } from '../../common/config/permissions.config';
import { User } from '../../users/entities/user.entity';
import { UserMembership } from '../entities/user-membership.entity';

interface UserMembershipInfo {
  id: number;
  username: string;
  email: string;
  membership?: {
    id: number;
    planName: string;
    planType: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    autoRenew: boolean;
    createdAt: string;
  };
  membershipHistory: Array<{
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
  }>;
}

/**
 * 管理员会员管理控制器
 */
@ApiTags('管理员会员管理')
@Controller('api/v1/admin/memberships')
@ApiBearerAuth()
export class AdminMembershipsController {
  constructor(
    private readonly membershipsService: UserMembershipsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}

  @Get('users')
  @ApiOperation({ summary: '获取所有用户的会员信息（管理员）' })
  @ApiQuery({ name: 'page', required: false, description: '页码', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', type: Number })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'planType', required: false, description: '套餐类型' })
  @ApiQuery({ name: 'status', required: false, description: '会员状态' })
  @ApiQuery({ name: 'autoRenew', required: false, description: '自动续费状态' })
  @RequirePermissions(MEMBERSHIP_PERMISSIONS.USER_VIEW)
  async getUsersMembershipInfo(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('planType') planType?: string,
    @Query('status') status?: string,
    @Query('autoRenew') autoRenew?: string,
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

    // 2. 获取每个用户的会员信息
    const usersWithMembershipInfo: UserMembershipInfo[] = await Promise.all(
      users.map(async (user) => {
        // 获取当前活跃会员
        const activeMembership = await this.membershipRepository
          .createQueryBuilder('membership')
          .leftJoinAndSelect('membership.plan', 'plan')
          .where('membership.userId = :userId', { userId: user.id })
          .andWhere('membership.isActive = :isActive', { isActive: true })
          .andWhere('membership.endDate > :now', { now: new Date() })
          .orderBy('membership.endDate', 'DESC')
          .getOne();

        // 获取会员历史记录
        const membershipHistory = await this.membershipRepository
          .createQueryBuilder('membership')
          .leftJoinAndSelect('membership.plan', 'plan')
          .where('membership.userId = :userId', { userId: user.id })
          .orderBy('membership.createdAt', 'DESC')
          .getMany();

        const userInfo: UserMembershipInfo = {
          id: user.id,
          username: user.username,
          email: user.email,
          membershipHistory: membershipHistory.map((m) => {
            // 判断会员状态
            const now = new Date();
            const isExpired = m.endDate < now;
            const status = !m.isActive ? 'cancelled' : (isExpired ? 'expired' : 'active');
            
            return {
              id: m.id,
              planName: m.plan?.name || '未知套餐',
              startDate: m.startDate.toISOString().split('T')[0],
              endDate: m.endDate.toISOString().split('T')[0],
              status,
              createdAt: m.createdAt.toISOString(),
            };
          }),
        };

        if (activeMembership) {
          userInfo.membership = {
            id: activeMembership.id,
            planName: activeMembership.plan?.name || '未知套餐',
            planType: activeMembership.plan?.type || 'basic',
            startDate: activeMembership.startDate.toISOString().split('T')[0],
            endDate: activeMembership.endDate.toISOString().split('T')[0],
            isActive: true,
            autoRenew: activeMembership.autoRenew,
            createdAt: activeMembership.createdAt.toISOString(),
          };
        }

        return userInfo;
      }),
    );

    // 3. 应用筛选条件
    let filteredUsers = usersWithMembershipInfo;

    // 筛选套餐类型
    if (planType) {
      filteredUsers = filteredUsers.filter(
        (user) => user.membership?.planType === planType,
      );
    }

    // 筛选状态
    if (status === 'active') {
      filteredUsers = filteredUsers.filter((user) => !!user.membership);
    } else if (status === 'expired') {
      filteredUsers = filteredUsers.filter(
        (user) => !user.membership && user.membershipHistory.length > 0,
      );
    } else if (status === 'none') {
      filteredUsers = filteredUsers.filter(
        (user) => user.membershipHistory.length === 0,
      );
    }

    // 筛选自动续费
    if (autoRenew === 'true') {
      filteredUsers = filteredUsers.filter(
        (user) => user.membership?.autoRenew === true,
      );
    } else if (autoRenew === 'false') {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.membership && user.membership.autoRenew === false,
      );
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
  @ApiOperation({ summary: '获取会员统计信息（管理员）' })
  @RequirePermissions(MEMBERSHIP_PERMISSIONS.USER_VIEW)
  async getMembershipStatistics() {
    // 1. 总用户数
    const totalUsers = await this.userRepository.count();

    // 2. 活跃会员数
    const activeMembers = await this.membershipRepository
      .createQueryBuilder('membership')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('membership.endDate > :now', { now: new Date() })
      .distinctOn(['membership.userId'])
      .getCount();

    // 3. 即将到期会员数（30天内到期）
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringSoon = await this.membershipRepository
      .createQueryBuilder('membership')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('membership.endDate > :now', { now: new Date() })
      .andWhere('membership.endDate <= :thirtyDays', {
        thirtyDays: thirtyDaysLater,
      })
      .getCount();

    // 4. 自动续费用户数
    const autoRenewUsers = await this.membershipRepository
      .createQueryBuilder('membership')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('membership.endDate > :now', { now: new Date() })
      .andWhere('membership.autoRenew = :autoRenew', { autoRenew: true })
      .distinctOn(['membership.userId'])
      .getCount();

    // 5. 各套餐类型分布（直接使用 type 字段）
    const planDistribution = await this.membershipRepository
      .createQueryBuilder('membership')
      .leftJoinAndSelect('membership.plan', 'plan')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('membership.endDate > :now', { now: new Date() })
      .select('plan.type', 'type')
      .addSelect('COUNT(DISTINCT membership.userId)', 'count')
      .groupBy('plan.type')
      .getRawMany();

    const distribution: Record<string, number> = {};

    // 直接使用返回的类型统计
    planDistribution.forEach((item) => {
      if (item.type) {
        distribution[item.type] = parseInt(item.count);
      }
    });

    return {
      success: true,
      data: {
        totalUsers,
        activeMembers,
        expiringSoon,
        autoRenewUsers,
        planDistribution: distribution,
        monthlyRevenue: 0, // TODO: 需要订单系统支持
        yearlyRevenue: 0, // TODO: 需要订单系统支持
      },
    };
  }
}
