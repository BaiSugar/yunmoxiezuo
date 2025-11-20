import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  PromptGroup,
  PromptGroupStatus,
  PromptGroupItem,
  PromptGroupPermission,
  PromptGroupPermissionType,
  PromptGroupApplication,
  PromptGroupApplicationStatus,
  PromptGroupLike,
} from '../entities';
import {
  CreatePromptGroupDto,
  UpdatePromptGroupDto,
  QueryPromptGroupsDto,
  ApplyPromptGroupDto,
  ReviewPromptGroupApplicationDto,
} from '../dto';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { PromptPermission, PermissionType } from '../../prompts/entities/prompt-permission.entity';

/**
 * 提示词组服务
 */
@Injectable()
export class PromptGroupService {
  private readonly logger = new Logger(PromptGroupService.name);

  constructor(
    @InjectRepository(PromptGroup)
    private readonly promptGroupRepository: Repository<PromptGroup>,
    @InjectRepository(PromptGroupItem)
    private readonly promptGroupItemRepository: Repository<PromptGroupItem>,
    @InjectRepository(PromptGroupPermission)
    private readonly permissionRepository: Repository<PromptGroupPermission>,
    @InjectRepository(PromptGroupApplication)
    private readonly applicationRepository: Repository<PromptGroupApplication>,
    @InjectRepository(PromptGroupLike)
    private readonly likeRepository: Repository<PromptGroupLike>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptPermission)
    private readonly promptPermissionRepository: Repository<PromptPermission>,
  ) {}

  /**
   * 创建提示词组
   */
  async create(userId: number, dto: CreatePromptGroupDto): Promise<PromptGroup> {
    // 验证提示词ID是否存在
    const promptIds = dto.items.map((item) => item.promptId);
    const prompts = await this.promptRepository.find({
      where: { id: In(promptIds) },
    });

    if (prompts.length !== promptIds.length) {
      throw new BadRequestException('部分提示词不存在');
    }

    // 验证用户是否拥有这些提示词的访问权限（暂时跳过，后续可加强）
    
    // 创建提示词组
    const group = this.promptGroupRepository.create({
      userId,
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      requireApplication: dto.requireApplication || false,
      categoryId: dto.categoryId,
      status: dto.status || PromptGroupStatus.DRAFT,
      viewCount: 0,
      useCount: 0,
      likeCount: 0,
      hotValue: 0,
    });

    const savedGroup = await this.promptGroupRepository.save(group);

    // 创建提示词组项
    const items = dto.items.map((item, index) =>
      this.promptGroupItemRepository.create({
        groupId: savedGroup.id,
        promptId: item.promptId,
        stageType: item.stageType,
        stageLabel: item.stageLabel,
        order: item.order !== undefined ? item.order : index,
        isRequired: item.isRequired !== undefined ? item.isRequired : true,
      }),
    );

    await this.promptGroupItemRepository.save(items);

    // 如果提示词组设置为需要申请，同步设置组内所有提示词也为需要申请
    if (dto.requireApplication) {
      await this.syncPromptRequireApplication(promptIds, true);
    }

    // 重新加载完整数据
    return this.findOne(savedGroup.id, userId);
  }

  /**
   * 查询提示词组列表
   */
  async findAll(dto: QueryPromptGroupsDto, userId?: number): Promise<{
    data: PromptGroup[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, pageSize = 20, categoryId, keyword, isPublic, userId: authorId, status, sortBy = 'hotValue', sortOrder = 'DESC' } = dto;

    const queryBuilder = this.promptGroupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.user', 'user')
      .leftJoinAndSelect('group.category', 'category')
      .leftJoinAndSelect('group.items', 'items')
      .leftJoinAndSelect('items.prompt', 'prompt')
      .where('group.deletedAt IS NULL');

    // 筛选条件
    if (categoryId) {
      queryBuilder.andWhere('group.categoryId = :categoryId', { categoryId });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(group.name LIKE :keyword OR group.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('group.isPublic = :isPublic', { isPublic });
    }

    if (authorId) {
      queryBuilder.andWhere('group.userId = :authorId', { authorId });
    }

    if (status) {
      queryBuilder.andWhere('group.status = :status', { status });
    }

    // 排序
    queryBuilder.orderBy(`group.${sortBy}`, sortOrder);

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    // 如果用户已登录，注入点赞状态
    if (userId) {
      await this.injectLikeStatus(data, userId);
    }

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取提示词组详情
   */
  async findOne(id: number, userId?: number): Promise<PromptGroup> {
    const group = await this.promptGroupRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'items', 'items.prompt'],
    });

    if (!group) {
      throw new NotFoundException('提示词组不存在');
    }

    // 权限检查
    if (group.status !== PromptGroupStatus.PUBLISHED && group.userId !== userId) {
      throw new ForbiddenException('无权访问此提示词组');
    }

    // 增加浏览次数
    if (userId && userId !== group.userId) {
      await this.incrementViewCount(id);
    }

    // 注入点赞状态
    if (userId) {
      await this.injectLikeStatus([group], userId);
    }

    return group;
  }

  /**
   * 更新提示词组
   */
  async update(id: number, userId: number, dto: UpdatePromptGroupDto): Promise<PromptGroup> {
    const group = await this.promptGroupRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!group) {
      throw new NotFoundException('提示词组不存在');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('无权修改此提示词组');
    }

    // 更新基本信息
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.description !== undefined) group.description = dto.description;
    if (dto.isPublic !== undefined) group.isPublic = dto.isPublic;
    if (dto.requireApplication !== undefined) group.requireApplication = dto.requireApplication;
    if (dto.categoryId !== undefined) group.categoryId = dto.categoryId;
    if (dto.status !== undefined) group.status = dto.status;

    await this.promptGroupRepository.save(group);

    // 如果提供了items，更新提示词组项
    if (dto.items) {
      // 删除旧的项
      await this.promptGroupItemRepository.delete({ groupId: id });

      // 创建新的项
      const items = dto.items.map((item, index) =>
        this.promptGroupItemRepository.create({
          groupId: id,
          promptId: item.promptId,
          stageType: item.stageType,
          stageLabel: item.stageLabel,
          order: item.order !== undefined ? item.order : index,
          isRequired: item.isRequired !== undefined ? item.isRequired : true,
        }),
      );

      await this.promptGroupItemRepository.save(items);

      // 如果提示词组设置为需要申请，同步设置组内所有提示词也为需要申请
      const promptIds = dto.items.map(item => item.promptId);
      if (group.requireApplication) {
        await this.syncPromptRequireApplication(promptIds, true);
      }
    } else if (dto.requireApplication !== undefined) {
      // 如果只更新了 requireApplication 状态，同步设置组内所有提示词
      const currentItems = await this.promptGroupItemRepository.find({
        where: { groupId: id },
      });
      const promptIds = currentItems.map(item => item.promptId);
      await this.syncPromptRequireApplication(promptIds, dto.requireApplication);
    }

    return this.findOne(id, userId);
  }

  /**
   * 删除提示词组（软删除）
   */
  async remove(id: number, userId: number): Promise<void> {
    const group = await this.promptGroupRepository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException('提示词组不存在');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('无权删除此提示词组');
    }

    await this.promptGroupRepository.softDelete(id);
  }

  /**
   * 申请使用提示词组
   */
  async apply(groupId: number, userId: number, dto: ApplyPromptGroupDto): Promise<PromptGroupApplication> {
    const group = await this.promptGroupRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('提示词组不存在');
    }

    if (!group.requireApplication) {
      throw new BadRequestException('此提示词组无需申请');
    }

    if (group.userId === userId) {
      throw new BadRequestException('不能申请自己的提示词组');
    }

    // 检查是否已申请
    const existingApplication = await this.applicationRepository.findOne({
      where: { groupId, userId },
    });

    if (existingApplication) {
      throw new BadRequestException('已申请过此提示词组，请勿重复申请');
    }

    const application = this.applicationRepository.create({
      groupId,
      userId,
      reason: dto.reason,
      status: PromptGroupApplicationStatus.PENDING,
    });

    return this.applicationRepository.save(application);
  }

  /**
   * 审核申请
   */
  async reviewApplication(
    applicationId: number,
    userId: number,
    dto: ReviewPromptGroupApplicationDto,
  ): Promise<PromptGroupApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['group'],
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    if (application.group.userId !== userId) {
      throw new ForbiddenException('无权审核此申请');
    }

    if (application.status !== PromptGroupApplicationStatus.PENDING) {
      throw new BadRequestException('申请已审核');
    }

    application.status = dto.status;
    application.reviewedBy = userId;
    application.reviewedAt = new Date();
    application.reviewNote = dto.reviewNote || null;

    await this.applicationRepository.save(application);

    // 如果批准，自动授予权限
    if (dto.status === PromptGroupApplicationStatus.APPROVED) {
      await this.grantPermission(application.groupId, application.userId, userId);
    }

    return application;
  }

  /**
   * 授予权限（同时授予提示词组和组内所有提示词的权限）
   */
  private async grantPermission(groupId: number, userId: number, grantedBy: number): Promise<void> {
    // 1. 授予提示词组权限
    const existingGroupPermission = await this.permissionRepository.findOne({
      where: { groupId, userId },
    });

    if (!existingGroupPermission) {
      const groupPermission = this.permissionRepository.create({
        groupId,
        userId,
        permission: PromptGroupPermissionType.USE,
        grantedBy,
      });
      await this.permissionRepository.save(groupPermission);
      this.logger.log(`授予用户 ${userId} 提示词组 ${groupId} 的使用权限`);
    }

    // 2. 获取提示词组内的所有提示词
    const group = await this.promptGroupRepository.findOne({
      where: { id: groupId },
      relations: ['items'],
    });

    if (!group || !group.items || group.items.length === 0) {
      this.logger.warn(`提示词组 ${groupId} 不存在或没有提示词项`);
      return;
    }

    // 3. 授予组内所有提示词的USE权限
    const promptIds = group.items.map(item => item.promptId);
    for (const promptId of promptIds) {
      // 检查是否已有权限
      const existingPromptPermission = await this.promptPermissionRepository.findOne({
        where: { promptId, userId },
      });

      if (!existingPromptPermission) {
        const promptPermission = this.promptPermissionRepository.create({
          promptId,
          userId,
          permission: PermissionType.USE,
          grantedBy,
        });
        await this.promptPermissionRepository.save(promptPermission);
        this.logger.log(`授予用户 ${userId} 提示词 ${promptId} 的使用权限`);
      }
    }

    this.logger.log(`成功授予用户 ${userId} 提示词组 ${groupId} 及其 ${promptIds.length} 个提示词的权限`);
  }

  /**
   * 获取我的申请列表
   */
  async getMyApplications(userId: number): Promise<PromptGroupApplication[]> {
    return this.applicationRepository.find({
      where: { userId },
      relations: ['group', 'group.user', 'reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取待审核的申请列表
   */
  async getPendingApplications(userId: number): Promise<PromptGroupApplication[]> {
    return this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.group', 'group')
      .leftJoinAndSelect('application.user', 'user')
      .where('group.userId = :userId', { userId })
      .andWhere('application.status = :status', { status: PromptGroupApplicationStatus.PENDING })
      .orderBy('application.createdAt', 'ASC')
      .getMany();
  }

  /**
   * 点赞
   */
  async like(groupId: number, userId: number): Promise<void> {
    const group = await this.promptGroupRepository.findOne({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('提示词组不存在');
    }

    // 检查是否已点赞
    const existingLike = await this.likeRepository.findOne({
      where: { groupId, userId },
    });

    if (existingLike) {
      throw new BadRequestException('已点赞过此提示词组');
    }

    const like = this.likeRepository.create({ groupId, userId });
    await this.likeRepository.save(like);

    // 更新点赞数和热度值
    await this.updateStats(groupId);
  }

  /**
   * 取消点赞
   */
  async unlike(groupId: number, userId: number): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { groupId, userId },
    });

    if (!like) {
      throw new BadRequestException('尚未点赞此提示词组');
    }

    await this.likeRepository.remove(like);

    // 更新点赞数和热度值
    await this.updateStats(groupId);
  }

  /**
   * 记录使用
   */
  async recordUse(groupId: number): Promise<void> {
    await this.promptGroupRepository.increment({ id: groupId }, 'useCount', 1);
    await this.updateStats(groupId);
  }

  /**
   * 获取提示词组的所有参数
   */
  async getParameters(groupId: number, userId?: number): Promise<any> {
    // 重新加载提示词组，包含 contents 关联
    const group = await this.promptGroupRepository.findOne({
      where: { id: groupId },
      relations: ['items', 'items.prompt', 'items.prompt.contents'],
    });

    if (!group) {
      throw new NotFoundException('提示词组不存在');
    }

    // 权限检查
    if (group.status !== PromptGroupStatus.PUBLISHED && group.userId !== userId) {
      throw new ForbiddenException('无权访问此提示词组');
    }

    const parameters: any[] = [];
    
    // 遍历每个提示词组项
    for (const item of group.items) {
      const prompt = item.prompt;
      
      if (!prompt || !prompt.contents) {
        continue;
      }

      // 提取每个提示词内容中的参数
      for (const content of prompt.contents) {
        if (content.parameters && Array.isArray(content.parameters)) {
          for (const param of content.parameters) {
            // 避免重复参数
            if (!parameters.find((p) => p.name === param.name)) {
              parameters.push({
                ...param,
                stageType: item.stageType,
                stageLabel: item.stageLabel,
              });
            }
          }
        }
      }
    }

    return {
      groupId,
      groupName: group.name,
      parameters,
    };
  }

  /**
   * 更新统计数据
   */
  private async updateStats(groupId: number): Promise<void> {
    const group = await this.promptGroupRepository.findOne({
      where: { id: groupId },
      relations: ['likes'],
    });

    if (!group) {
      return;
    }

    // 更新点赞数
    group.likeCount = group.likes?.length || 0;

    // 计算热度值: viewCount * 1 + useCount * 5 + likeCount * 10
    group.hotValue = group.viewCount * 1 + group.useCount * 5 + group.likeCount * 10;

    await this.promptGroupRepository.save(group);
  }

  /**
   * 增加浏览次数
   */
  private async incrementViewCount(groupId: number): Promise<void> {
    await this.promptGroupRepository.increment({ id: groupId }, 'viewCount', 1);
    await this.updateStats(groupId);
  }

  /**
   * 注入点赞状态
   */
  private async injectLikeStatus(groups: PromptGroup[], userId: number): Promise<void> {
    const groupIds = groups.map((g) => g.id);
    const likes = await this.likeRepository.find({
      where: { groupId: In(groupIds), userId },
    });

    const likedGroupIds = new Set(likes.map((like) => like.groupId));

    groups.forEach((group) => {
      group.isLiked = likedGroupIds.has(group.id);
    });
  }

  /**
   * 同步设置组内所有提示词的requireApplication状态
   */
  private async syncPromptRequireApplication(promptIds: number[], requireApplication: boolean): Promise<void> {
    if (!promptIds || promptIds.length === 0) {
      return;
    }

    // 批量更新提示词的requireApplication状态
    await this.promptRepository.update(
      { id: In(promptIds) },
      { requireApplication },
    );

    this.logger.log(`同步设置 ${promptIds.length} 个提示词的requireApplication状态为 ${requireApplication}`);
  }

  /**
   * 检查用户是否有权限使用提示词组
   */
  async checkPermission(groupId: number, userId: number): Promise<boolean> {
    const group = await this.promptGroupRepository.findOne({ where: { id: groupId } });

    if (!group) {
      return false;
    }

    // 作者始终有权限
    if (group.userId === userId) {
      return true;
    }

    // 公开且不需要申请的提示词组，所有人都可以使用
    if (group.isPublic && !group.requireApplication) {
      return true;
    }

    // 检查是否有权限记录
    const permission = await this.permissionRepository.findOne({
      where: { groupId, userId },
    });

    return !!permission;
  }
}

