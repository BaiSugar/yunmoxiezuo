import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserMembershipsService } from '../services/user-memberships.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { MEMBERSHIP_PERMISSIONS } from '../../common/config/permissions.config';
import { MembershipSource } from '../enums/membership-source.enum';

/**
 * 用户会员控制器
 */
@ApiTags('用户会员')
@Controller('/api/v1/user-memberships')
@ApiBearerAuth()
export class UserMembershipsController {
  constructor(private readonly membershipsService: UserMembershipsService) {}

  // ⚠️ 重要：具体路径必须在前面

  @Post('user/:userId/activate')
  @ApiOperation({ summary: '为用户开通会员（管理员）' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '开通成功' })
  @RequirePermissions(MEMBERSHIP_PERMISSIONS.USER_ACTIVATE)
  async activateForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { planId: number; duration?: number },
  ) {
    return this.membershipsService.activate(
      userId,
      body.planId,
      MembershipSource.ADMIN,
      undefined, // relatedId
      body.duration, // customDuration
    );
  }

  @Get('user/:userId/active')
  @ApiOperation({ summary: '获取指定用户的活跃会员（管理员）' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @RequirePermissions(MEMBERSHIP_PERMISSIONS.USER_VIEW)
  getUserActiveMembership(@Param('userId', ParseIntPipe) userId: number) {
    return this.membershipsService.findActiveByUser(userId);
  }

  @Get('me/active')
  @ApiOperation({ summary: '获取当前用户的活跃会员' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getMyActiveMembership(@CurrentUser('id') userId: number) {
    return this.membershipsService.findActiveByUser(userId);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户的所有会员记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getMyMemberships(
    @CurrentUser('id') userId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.membershipsService.findAllByUser(userId, page, limit);
  }

  @Post(':membershipId/cancel-auto-renew')
  @ApiOperation({ summary: '取消自动续费' })
  @ApiResponse({ status: 200, description: '取消成功' })
  cancelAutoRenew(
    @CurrentUser('id') userId: number,
    @Param('membershipId', ParseIntPipe) membershipId: number,
  ) {
    return this.membershipsService.cancelAutoRenew(userId, membershipId);
  }
}
