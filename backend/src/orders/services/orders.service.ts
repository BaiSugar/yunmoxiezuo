import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderType } from '../enums/order-type.enum';
import { MembershipPlansService } from '../../memberships/services/membership-plans.service';
import { TokenPackagesService } from '../../token-packages/services/token-packages.service';
import { UserMembershipsService } from '../../memberships/services/user-memberships.service';
import { TokenBalancesService } from '../../token-balances/services/token-balances.service';
import { MembershipSource } from '../../memberships/enums/membership-source.enum';

/**
 * 订单服务
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly membershipPlansService: MembershipPlansService,
    private readonly tokenPackagesService: TokenPackagesService,
    private readonly userMembershipsService: UserMembershipsService,
    private readonly tokenBalancesService: TokenBalancesService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 创建订单
   */
  async create(userId: number, createDto: CreateOrderDto): Promise<Order> {
    let productName: string;
    let amount: number;

    // 获取产品信息
    if (createDto.type === OrderType.MEMBERSHIP) {
      const plan = await this.membershipPlansService.findOne(createDto.productId);
      if (!plan.isActive) {
        throw new BadRequestException('该套餐已下架');
      }
      productName = plan.name;
      amount = Number(plan.price);
    } else {
      const pkg = await this.tokenPackagesService.findOne(createDto.productId);
      if (!pkg.isActive) {
        throw new BadRequestException('该字数包已下架');
      }
      productName = pkg.name;
      amount = Number(pkg.price);
    }

    // 生成订单号
    const orderNo = this.generateOrderNo();

    const order = this.orderRepository.create({
      orderNo,
      userId,
      type: createDto.type,
      productId: createDto.productId,
      productName,
      amount,
      paymentMethod: createDto.paymentMethod,
      status: OrderStatus.PENDING,
      remark: createDto.remark,
    });

    return await this.orderRepository.save(order);
  }

  /**
   * 支付订单（模拟支付，实际应对接支付网关）
   */
  async pay(orderNo: string, userId: number, transactionId?: string): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { orderNo, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('订单状态不允许支付');
      }

      // 更新订单状态
      order.status = OrderStatus.PAID;
      order.paidAt = new Date();
      if (transactionId) {
        order.transactionId = transactionId;
      }
      await manager.save(order);

      // 发货
      if (order.type === OrderType.MEMBERSHIP) {
        await this.userMembershipsService.activate(
          userId,
          order.productId,
          MembershipSource.PURCHASE,
          order.id,
          undefined, // customDuration - 使用套餐默认时长
        );
      } else {
        const pkg = await this.tokenPackagesService.findOne(order.productId);
        const totalTokens = Number(pkg.tokenAmount) + Number(pkg.bonusTokens);
        await this.tokenBalancesService.recharge(
          userId,
          totalTokens,
          Number(pkg.bonusTokens) > 0,
          'purchase',
          order.id,
          `购买字数包：${pkg.name}`,
        );
      }

      return order;
    });
  }

  /**
   * 退款
   */
  async refund(orderNo: string, userId: number): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { orderNo, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      if (order.status !== OrderStatus.PAID) {
        throw new BadRequestException('只能退款已支付的订单');
      }

      order.status = OrderStatus.REFUNDED;
      order.refundedAt = new Date();
      await manager.save(order);

      // 退款逻辑（这里简化处理）
      if (order.type === OrderType.TOKEN) {
        const pkg = await this.tokenPackagesService.findOne(order.productId);
        const totalTokens = Number(pkg.tokenAmount) + Number(pkg.bonusTokens);
        // 注意：实际应检查用户是否已使用这些字数
        await this.tokenBalancesService.refund(
          userId,
          totalTokens,
          'refund',
          order.id,
          `退款订单：${order.orderNo}`,
        );
      }

      return order;
    });
  }

  /**
   * 取消订单
   */
  async cancel(orderNo: string, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { orderNo, userId } });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只能取消待支付的订单');
    }

    order.status = OrderStatus.CANCELLED;
    return await this.orderRepository.save(order);
  }

  /**
   * 查询订单
   */
  async findOne(orderNo: string, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { orderNo, userId } });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  /**
   * 查询用户订单列表
   */
  async findByUser(
    userId: number,
    status?: OrderStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = { userId };
    if (status) where.status = status;

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }
}
