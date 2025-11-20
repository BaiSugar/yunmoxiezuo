import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlan } from './entities/membership-plan.entity';
import { UserMembership } from './entities/user-membership.entity';
import { MembershipPlansService } from './services/membership-plans.service';
import { UserMembershipsService } from './services/user-memberships.service';
import { MembershipPermissionsService } from './services/membership-permissions.service';
import { MembershipPlansController } from './controllers/membership-plans.controller';
import { UserMembershipsController } from './controllers/user-memberships.controller';
import { AdminMembershipsController } from './controllers/admin-memberships.controller';
import { MembershipExpiryTask } from './tasks/membership-expiry.task';
import { User } from '../users/entities/user.entity';
import { WebSocketModule } from '../websocket/websocket.module';

/**
 * 会员系统模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipPlan, UserMembership, User]),
    forwardRef(() => WebSocketModule),
  ],
  controllers: [
    MembershipPlansController,
    UserMembershipsController,
    AdminMembershipsController,
  ],
  providers: [
    MembershipPlansService,
    UserMembershipsService,
    MembershipPermissionsService,
    MembershipExpiryTask,
  ],
  exports: [
    MembershipPlansService,
    UserMembershipsService,
    MembershipPermissionsService,
  ],
})
export class MembershipsModule {}
