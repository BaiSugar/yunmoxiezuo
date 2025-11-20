import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersService } from './services/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { MembershipsModule } from '../memberships/memberships.module';
import { TokenPackagesModule } from '../token-packages/token-packages.module';
import { TokenBalancesModule } from '../token-balances/token-balances.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    MembershipsModule,
    TokenPackagesModule,
    TokenBalancesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
