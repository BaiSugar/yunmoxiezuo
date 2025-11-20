import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, FindOptionsWhere } from 'typeorm';
import { RedemptionCode } from '../entities/redemption-code.entity';
import { RedemptionRecord } from '../entities/redemption-record.entity';
import { CreateRedemptionCodeDto } from '../dto/create-redemption-code.dto';
import { UpdateRedemptionCodeDto } from '../dto/update-redemption-code.dto';
import { BatchCreateCodesDto } from '../dto/batch-create-codes.dto';
import { CodeGeneratorService } from './code-generator.service';
import { CodeType } from '../enums/code-type.enum';

/**
 * 卡密管理服务
 */
@Injectable()
export class RedemptionCodesService {
  constructor(
    @InjectRepository(RedemptionCode)
    private readonly codeRepository: Repository<RedemptionCode>,
    @InjectRepository(RedemptionRecord)
    private readonly recordRepository: Repository<RedemptionRecord>,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 创建单个卡密
   */
  async create(createDto: CreateRedemptionCodeDto, creatorId: number): Promise<RedemptionCode> {
    this.validateCodeData(createDto);

    const code = this.codeGenerator.generateCode();

    const redemptionCode = this.codeRepository.create({
      ...createDto,
      code,
      creatorId,
    });

    return await this.codeRepository.save(redemptionCode);
  }

  /**
   * 批量创建卡密
   */
  async batchCreate(batchDto: BatchCreateCodesDto, creatorId: number): Promise<RedemptionCode[]> {
    this.validateCodeData(batchDto);

    const { count, ...createDto } = batchDto;
    const batchId = batchDto.batchId || this.codeGenerator.generateBatchId();
    const codes = this.codeGenerator.generateBatch(count);

    const redemptionCodes = codes.map((code) =>
      this.codeRepository.create({
        ...createDto,
        code,
        batchId,
        creatorId,
      }),
    );

    return await this.codeRepository.save(redemptionCodes);
  }

  /**
   * 验证卡密数据
   */
  private validateCodeData(data: CreateRedemptionCodeDto): void {
    if (data.type === CodeType.MEMBERSHIP && !data.membershipPlanId) {
      throw new BadRequestException('会员卡密必须指定会员套餐');
    }

    if (data.type === CodeType.TOKEN && (!data.tokenAmount || data.tokenAmount <= 0)) {
      throw new BadRequestException('字数卡密必须指定字数数量');
    }

    if (data.type === CodeType.MIXED && (!data.membershipPlanId || !data.tokenAmount)) {
      throw new BadRequestException('混合卡密必须同时指定会员套餐和字数');
    }
  }

  /**
   * 查询所有卡密（带分页）
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    type?: string;
    batchId?: string;
    isActive?: boolean;
    code?: string;
  }) {
    const { page = 1, limit = 20, type, batchId, isActive, code } = query;

    const where: FindOptionsWhere<RedemptionCode> = {};
    if (type) where.type = type as any;
    if (batchId) where.batchId = batchId;
    if (isActive !== undefined) where.isActive = isActive;
    if (code) where.code = code;

    const [data, total] = await this.codeRepository.findAndCount({
      where,
      relations: ['membershipPlan', 'creator'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * 获取统计信息
   */
  async getStatistics() {
    const totalCodes = await this.codeRepository.count();
    const activeCodes = await this.codeRepository.count({ where: { isActive: true } });
    
    // 已使用的卡密（usedCount > 0）
    const usedCodes = await this.codeRepository
      .createQueryBuilder('code')
      .where('code.usedCount > 0')
      .getCount();
    
    // 已过期的卡密
    const expiredCodes = await this.codeRepository
      .createQueryBuilder('code')
      .where('code.validTo IS NOT NULL')
      .andWhere('code.validTo < :now', { now: new Date() })
      .getCount();

    return { totalCodes, activeCodes, usedCodes, expiredCodes };
  }

  /**
   * 查询单个卡密（通过ID或code）
   */
  async findOne(idOrCode: number | string): Promise<RedemptionCode> {
    const where = typeof idOrCode === 'number' ? { id: idOrCode } : { code: idOrCode };
    
    const redemptionCode = await this.codeRepository.findOne({
      where,
      relations: ['membershipPlan', 'creator'],
    });

    if (!redemptionCode) {
      throw new NotFoundException('卡密不存在');
    }

    return redemptionCode;
  }

  /**
   * 更新卡密
   */
  async update(id: number, updateDto: UpdateRedemptionCodeDto): Promise<RedemptionCode> {
    const code = await this.codeRepository.findOne({ where: { id } });
    if (!code) throw new NotFoundException('卡密不存在');

    // 不允许修改类型
    if (updateDto.type && updateDto.type !== code.type) {
      throw new BadRequestException('不允许修改卡密类型');
    }

    Object.assign(code, updateDto);
    return await this.codeRepository.save(code);
  }

  /**
   * 删除卡密
   */
  async remove(id: number): Promise<{ message: string }> {
    const code = await this.codeRepository.findOne({ where: { id } });
    if (!code) throw new NotFoundException('卡密不存在');

    // 如果已使用，不允许删除
    if (code.usedCount > 0) {
      throw new BadRequestException('已使用的卡密不允许删除');
    }

    await this.codeRepository.remove(code);
    return { message: '删除成功' };
  }

  /**
   * 切换卡密状态
   */
  async toggleStatus(id: number): Promise<RedemptionCode> {
    const code = await this.codeRepository.findOne({ where: { id } });
    if (!code) throw new NotFoundException('卡密不存在');

    code.isActive = !code.isActive;
    return await this.codeRepository.save(code);
  }

  /**
   * 查询批次
   */
  async findByBatch(batchId: string, page: number = 1, limit: number = 50) {
    const [data, total] = await this.codeRepository.findAndCount({
      where: { batchId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * 查询使用记录
   */
  async findRecords(codeId: number, page: number = 1, limit: number = 20) {
    const [data, total] = await this.recordRepository.findAndCount({
      where: { codeId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * 停用卡密
   */
  async deactivate(id: number): Promise<RedemptionCode> {
    const code = await this.codeRepository.findOne({ where: { id } });
    if (!code) throw new NotFoundException('卡密不存在');

    code.isActive = false;
    return await this.codeRepository.save(code);
  }

  /**
   * 批量停用
   */
  async batchDeactivate(ids: number[]): Promise<number> {
    const result = await this.codeRepository.update(
      { id: In(ids) },
      { isActive: false },
    );
    return result.affected || 0;
  }
}
