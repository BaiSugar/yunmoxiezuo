import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { MembershipPlan } from '../entities/membership-plan.entity';
import { CreateMembershipPlanDto } from '../dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dto/update-membership-plan.dto';
import { QueryMembershipPlanDto } from '../dto/query-membership-plan.dto';

/**
 * 会员套餐服务
 */
@Injectable()
export class MembershipPlansService {
  constructor(
    @InjectRepository(MembershipPlan)
    private readonly planRepository: Repository<MembershipPlan>,
  ) {}

  /**
   * 创建会员套餐
   */
  async create(createDto: CreateMembershipPlanDto): Promise<MembershipPlan> {
    // 检查同等级是否已存在
    const existing = await this.planRepository.findOne({
      where: { level: createDto.level },
    });

    if (existing) {
      throw new BadRequestException(`等级 ${createDto.level} 的套餐已存在`);
    }

    const plan = this.planRepository.create(createDto);
    return await this.planRepository.save(plan);
  }

  /**
   * 查询套餐列表
   */
  async findAll(query: QueryMembershipPlanDto) {
    const { isActive, minLevel, maxLevel, page = 1, limit = 20 } = query;

    const where: FindOptionsWhere<MembershipPlan> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (minLevel !== undefined && maxLevel !== undefined) {
      where.level = Between(minLevel, maxLevel);
    } else if (minLevel !== undefined) {
      where.level = Between(minLevel, 999);
    } else if (maxLevel !== undefined) {
      where.level = Between(0, maxLevel);
    }

    const [data, total] = await this.planRepository.findAndCount({
      where,
      order: { sort: 'ASC', level: 'ASC' },
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
   * 获取套餐详情
   */
  async findOne(id: number): Promise<MembershipPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`套餐 #${id} 不存在`);
    }

    return plan;
  }

  /**
   * 根据等级获取套餐
   */
  async findByLevel(level: number): Promise<MembershipPlan | null> {
    return await this.planRepository.findOne({ where: { level } });
  }

  /**
   * 更新套餐
   */
  async update(id: number, updateDto: UpdateMembershipPlanDto): Promise<MembershipPlan> {
    const plan = await this.findOne(id);

    // 如果修改等级，检查新等级是否已存在
    if (updateDto.level !== undefined && updateDto.level !== plan.level) {
      const existing = await this.planRepository.findOne({
        where: { level: updateDto.level },
      });

      if (existing) {
        throw new BadRequestException(`等级 ${updateDto.level} 的套餐已存在`);
      }
    }

    Object.assign(plan, updateDto);
    return await this.planRepository.save(plan);
  }

  /**
   * 删除套餐
   */
  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
  }

  /**
   * 上架套餐
   */
  async activate(id: number): Promise<MembershipPlan> {
    const plan = await this.findOne(id);
    plan.isActive = true;
    return await this.planRepository.save(plan);
  }

  /**
   * 下架套餐
   */
  async deactivate(id: number): Promise<MembershipPlan> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    return await this.planRepository.save(plan);
  }

  /**
   * 切换套餐状态（上架/下架）
   */
  async toggleStatus(id: number): Promise<MembershipPlan> {
    const plan = await this.findOne(id);
    plan.isActive = !plan.isActive;
    return await this.planRepository.save(plan);
  }
}
