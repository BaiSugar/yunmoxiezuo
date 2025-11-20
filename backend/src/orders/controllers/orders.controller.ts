import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderStatus } from '../enums/order-status.enum';

/**
 * 订单控制器
 */
@ApiTags('订单管理')
@Controller('/api/v1/orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(@CurrentUser('id') userId: number, @Body() createDto: CreateOrderDto) {
    return this.ordersService.create(userId, createDto);
  }

  @Post(':orderNo/pay')
  @ApiOperation({ summary: '支付订单' })
  pay(
    @Param('orderNo') orderNo: string,
    @CurrentUser('id') userId: number,
    @Body('transactionId') transactionId?: string,
  ) {
    return this.ordersService.pay(orderNo, userId, transactionId);
  }

  @Post(':orderNo/refund')
  @ApiOperation({ summary: '申请退款' })
  refund(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: number) {
    return this.ordersService.refund(orderNo, userId);
  }

  @Post(':orderNo/cancel')
  @ApiOperation({ summary: '取消订单' })
  cancel(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: number) {
    return this.ordersService.cancel(orderNo, userId);
  }

  @Get('my')
  @ApiOperation({ summary: '查询我的订单' })
  getMyOrders(
    @CurrentUser('id') userId: number,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findByUser(userId, status, page, limit);
  }

  @Get(':orderNo')
  @ApiOperation({ summary: '查询订单详情' })
  findOne(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: number) {
    return this.ordersService.findOne(orderNo, userId);
  }
}
