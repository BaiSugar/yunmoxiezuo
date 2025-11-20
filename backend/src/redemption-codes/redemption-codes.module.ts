import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedemptionCode } from './entities/redemption-code.entity';
import { RedemptionRecord } from './entities/redemption-record.entity';
import { RedemptionCodesService } from './services/redemption-codes.service';
import { CodeRedemptionService } from './services/code-redemption.service';
import { CodeGeneratorService } from './services/code-generator.service';
import { RedemptionCodesController } from './controllers/redemption-codes.controller';
import { MembershipsModule } from '../memberships/memberships.module';
import { TokenBalancesModule } from '../token-balances/token-balances.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RedemptionCode, RedemptionRecord]),
    MembershipsModule,
    TokenBalancesModule,
  ],
  controllers: [RedemptionCodesController],
  providers: [
    RedemptionCodesService,
    CodeRedemptionService,
    CodeGeneratorService,
  ],
  exports: [RedemptionCodesService, CodeRedemptionService],
})
export class RedemptionCodesModule {}
