import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserTokenBalance } from './entities/user-token-balance.entity';
import { TokenTransaction } from './entities/token-transaction.entity';
import { TokenConsumptionRecord } from './entities/token-consumption-record.entity';
import { TokenBalancesService } from './services/token-balances.service';
import { CharacterCounterService } from './services/character-counter.service';
import { TokenConsumptionService } from './services/token-consumption.service';
import { TokenBalancesController } from './controllers/token-balances.controller';
import { AdminTokenBalancesController } from './controllers/admin-token-balances.controller';
import { DailyQuotaResetTask } from './tasks/daily-quota-reset.task';
import { AiModel } from '../ai-models/entities/ai-model.entity';
import { UserMembership } from '../memberships/entities/user-membership.entity';
import { MembershipPlan } from '../memberships/entities/membership-plan.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTokenBalance,
      TokenTransaction,
      TokenConsumptionRecord,
      AiModel,
      UserMembership,
      MembershipPlan,
      User,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [TokenBalancesController, AdminTokenBalancesController],
  providers: [
    TokenBalancesService,
    CharacterCounterService,
    TokenConsumptionService,
    DailyQuotaResetTask,
  ],
  exports: [
    TokenBalancesService,
    CharacterCounterService,
    TokenConsumptionService,
  ],
})
export class TokenBalancesModule {}
