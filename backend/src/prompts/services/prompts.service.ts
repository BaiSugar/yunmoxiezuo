import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, DataSource } from 'typeorm';
import { Prompt, PromptStatus } from '../entities/prompt.entity';
import { PromptContent } from '../entities/prompt-content.entity';
import { PromptFavorite } from '../entities/prompt-favorite.entity';
import { PermissionType } from '../entities/prompt-permission.entity';
import { CreatePromptDto } from '../dto/create-prompt.dto';
import { UpdatePromptDto } from '../dto/update-prompt.dto';
import { QueryPromptDto } from '../dto/query-prompt.dto';
import { BatchUpdatePromptsDto } from '../dto/batch-update-prompts.dto';
import { BanPromptDto } from '../dto/ban-prompt.dto';
import { PromptStatsService } from './prompt-stats.service';
import { PromptPermissionService } from './prompt-permission.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UsersService } from '../../users/users.service';
import { PERMISSIONS } from '../../common/config/permissions.config';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptContent)
    private readonly contentRepository: Repository<PromptContent>,
    @InjectRepository(PromptFavorite)
    private readonly promptFavoriteRepository: Repository<PromptFavorite>,
    @Inject(forwardRef(() => PromptStatsService))
    private readonly statsService: PromptStatsService,
    @Inject(forwardRef(() => PromptPermissionService))
    private readonly permissionService: PromptPermissionService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // 用于WebSocket通知
  private websocketGateway: any;

  setWebSocketGateway(gateway: any) {
    this.websocketGateway = gateway;
  }

  async create(userId: number, createPromptDto: CreatePromptDto): Promise<Prompt> {
    const { contents, ...promptData } = createPromptDto;

    const prompt = this.promptRepository.create({
      ...promptData,
      authorId: userId,
    });

    const savedPrompt = await this.promptRepository.save(prompt);

    if (contents && contents.length > 0) {
      const contentEntities = contents.map((content) =>
        this.contentRepository.create({
          ...content,
          promptId: savedPrompt.id,
        }),
      );
      await this.contentRepository.save(contentEntities);
    }

    return await this.findOne(savedPrompt.id, userId, true);
  }

  async findAll(queryPromptDto: QueryPromptDto, userId?: number): Promise<{
    data: Prompt[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      isPublic,
      authorId,
      keyword,
      status,
      sortBy = 'hotValue',
      sortOrder = 'DESC',
    } = queryPromptDto;

    const skip = (page - 1) * pageSize;
    const queryBuilder = this.promptRepository
      .createQueryBuilder('prompt')
      // 只选择author的必要字段（不包含敏感信息）
      .leftJoin('prompt.author', 'author')
      .addSelect(['author.id', 'author.username', 'author.nickname', 'author.avatar'])
      .leftJoinAndSelect('prompt.category', 'category');

    // 核心安全过滤：非作者只能看到公开的提示词
    if (userId) {
      // 登录用户：只看自己的提示词 或 公开的提示词
      queryBuilder.andWhere(
        '(prompt.isPublic = :isPublic OR prompt.authorId = :userId)',
        { isPublic: true, userId }
      );
    } else {
      // 未登录用户：需要登录
      throw new ForbiddenException('需要登录后才能查看提示词');
    }

    // 过滤掉被封禁的提示词、需要审核的提示词和状态过滤
    // 在"广场"场景（status='published' 或 undefined）下：
    // 1. 完全过滤掉被封禁的提示词
    // 2. 完全过滤掉需要审核的提示词（needsReview=true）
    // 3. 只显示已发布（published）状态的提示词（所有人，包括作者）
    // 4. 只显示公开（isPublic=true）的提示词（所有人，包括作者）
    // 作者的草稿/归档/需要审核/未公开的提示词只在"我的提示词"中显示
    if (status === 'published' || status === undefined) {
      // 广场场景：完全过滤掉被封禁的提示词
      queryBuilder.andWhere('prompt.isBanned = :isBanned', { isBanned: false });
      
      // 广场场景：完全过滤掉需要审核的提示词（所有人，包括作者）
      queryBuilder.andWhere('prompt.needsReview = :needsReview', { needsReview: false });
      
      // 广场场景：只显示已发布的提示词（所有人，包括作者）
      queryBuilder.andWhere('prompt.status = :publishedStatus', { publishedStatus: 'published' });
      
      // 广场场景：只显示公开的提示词（所有人，包括作者）
      queryBuilder.andWhere('prompt.isPublic = :isPublicForSquare', { isPublicForSquare: true });
    } else {
      // 其他场景（明确指定了 status）：如果是作者，可以看到自己被封禁的提示词
      if (userId) {
        queryBuilder.andWhere(
          '(prompt.isBanned = :isBanned OR prompt.authorId = :userIdForBan)',
          { isBanned: false, userIdForBan: userId }
        );
        // 过滤需要审核的提示词（作者除外）
        queryBuilder.andWhere(
          '(prompt.needsReview = :needsReview OR prompt.authorId = :userIdForReview)',
          { needsReview: false, userIdForReview: userId }
        );
      } else {
        queryBuilder.andWhere('prompt.isBanned = :isBanned', { isBanned: false });
        queryBuilder.andWhere('prompt.needsReview = :needsReview', { needsReview: false });
      }
      
      // 如果明确指定了status，使用该status过滤
      queryBuilder.andWhere('prompt.status = :status', { status });
    }

    if (categoryId !== undefined) {
      queryBuilder.andWhere('prompt.categoryId = :categoryId', { categoryId });
    }

    // 如果明确指定isPublic参数，则以该参数为准（但仍受上面安全过滤限制）
    if (isPublic !== undefined && !userId) {
      // 未登录用户不应该能够看到非公开提示词
      queryBuilder.andWhere('prompt.isPublic = :isPublicParam', { isPublicParam: isPublic });
    }

    if (authorId !== undefined) {
      queryBuilder.andWhere('prompt.authorId = :authorId', { authorId });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(prompt.name LIKE :keyword OR prompt.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const validSortFields = ['hotValue', 'createdAt', 'viewCount', 'useCount', 'likeCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'hotValue';
    queryBuilder.orderBy(`prompt.${sortField}`, sortOrder);

    const [data, total] = await queryBuilder.skip(skip).take(pageSize).getManyAndCount();

    // 为每个提示词添加isLiked、isFavorited和hasPermission状态（批量查询优化）
    if (userId && data.length > 0) {
      const promptIds = data.map(p => p.id);
      const [likedMap, favoritedMap] = await Promise.all([
        this.statsService.getBatchLikedStatus(promptIds, userId),
        this.statsService.getBatchFavoritedStatus(promptIds, userId)
      ]);

      for (const prompt of data) {
        (prompt as any).isLiked = likedMap.get(prompt.id) || false;
        (prompt as any).isFavorited = favoritedMap.get(prompt.id) || false;
        
        // 添加hasPermission字段
        (prompt as any).hasPermission = await this.permissionService.checkPermission(
          prompt.id,
          userId,
          PermissionType.USE
        );
      }
    } else {
      // 未登录用户全部标记为未点赞、未收藏、无权限
      for (const prompt of data) {
        (prompt as any).isLiked = false;
        (prompt as any).isFavorited = false;
        (prompt as any).hasPermission = false;
      }
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

  async findOne(id: number, userId?: number, includeContents: boolean = false): Promise<Prompt> {
    const queryBuilder = this.promptRepository
      .createQueryBuilder('prompt')
      .leftJoinAndSelect('prompt.author', 'author')
      .leftJoinAndSelect('prompt.category', 'category')
      .where('prompt.id = :id', { id });

    if (includeContents) {
      queryBuilder
        .leftJoinAndSelect('prompt.contents', 'contents')
        .orderBy('contents.order', 'ASC');
    }

    const prompt = await queryBuilder.getOne();

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    // 检查审核状态：需要审核的提示词只有作者可以访问
    if (prompt.needsReview) {
      if (!userId || prompt.authorId !== userId) {
        throw new ForbiddenException('此提示词正在审核中，暂时无法访问');
      }
    }

    // 检查访问权限：草稿状态只能作者访问
    if (prompt.status === 'draft') {
      if (!userId || prompt.authorId !== userId) {
        throw new ForbiddenException('此提示词尚未发布');
      }
    }

    // 检查归档状态：归档的提示词只有作者可以访问
    if (prompt.status === 'archived') {
      if (!userId || prompt.authorId !== userId) {
        throw new ForbiddenException('此提示词已归档');
      }
    }

    // 检查封禁状态：被封禁的提示词只有作者可以访问
    if (prompt.isBanned) {
      if (!userId || prompt.authorId !== userId) {
        throw new ForbiddenException('此提示词已被封禁');
      }
    }

    // 检查内容访问权限：如果内容不公开，提取参数列表后删除contents
    if (!prompt.isContentPublic) {
      if (!userId || prompt.authorId !== userId) {
        // 提取所有参数到一个单独的数组
        const allParameters: any[] = [];
        if (prompt.contents) {
          prompt.contents.forEach(content => {
            if (content.isEnabled && content.parameters && content.parameters.length > 0) {
              allParameters.push(...content.parameters);
            }
          });
        }
        
        // 删除contents，只保留参数列表
        (prompt as any).parameters = allParameters;
        prompt.contents = undefined;
      }
    }

    // 添加用户点赞状态（仅在用户登录时查询）
    if (userId) {
      const isLiked = await this.statsService.isLikedByUser(id, userId);
      (prompt as any).isLiked = isLiked;
      const isFavorited = await this.statsService.isFavoritedByUser(id, userId);
      (prompt as any).isFavorited = isFavorited;
      
      // 添加用户使用权限状态
      const hasPermission = await this.permissionService.checkPermission(id, userId, PermissionType.USE);
      (prompt as any).hasPermission = hasPermission;
    } else {
      (prompt as any).isLiked = false;
      (prompt as any).isFavorited = false;
      (prompt as any).hasPermission = false;
    }

    return prompt;
  }

  /**
   * 获取提示词配置信息（不包含敏感的content文本）
   * @param id 提示词ID
   * @param userId 当前用户ID
   * @returns 提示词配置信息
   */
  async getPromptConfig(id: number, userId?: number): Promise<any> {
    const prompt = await this.promptRepository
      .createQueryBuilder('prompt')
      .leftJoinAndSelect('prompt.contents', 'contents')
      .leftJoinAndSelect('prompt.author', 'author')
      .leftJoinAndSelect('prompt.category', 'category')
      .where('prompt.id = :id', { id })
      .orderBy('contents.order', 'ASC')
      .getOne();

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    // 判断用户是否为作者
    const isAuthor = userId && prompt.authorId === userId;

    // 0. 检查审核状态：需要审核的提示词禁止使用（包括作者）
    // 这个接口用于获取配置以便使用提示词，所以即使是作者也不能使用审核中的提示词
    if (prompt.needsReview) {
      throw new ForbiddenException('该提示词因违规被下架，正在等待管理员审核，暂时无法使用。请修改后提交审核或联系管理员');
    }

    // 1. 检查封禁状态：被封禁的提示词禁止使用（包括作者）
    // 这个接口用于获取配置以便使用提示词，所以即使是作者也不能使用被封禁的提示词
    if (prompt.isBanned) {
      throw new ForbiddenException('此提示词已被封禁，无法使用');
    }

    // 2. 检查提示词状态：草稿和归档只有作者可以访问
    if (prompt.status === 'draft' || prompt.status === 'archived') {
      if (!isAuthor) {
        throw new ForbiddenException('无权访问此提示词');
      }
    }

    // 3. 检查提示词公开性：私有提示词只有作者可以访问
    if (!prompt.isPublic && !isAuthor) {
      throw new ForbiddenException('该提示词为私有，无法访问');
    }

    // 3. 检查使用权限：公开且需要申请的提示词，必须获得授权
    if (prompt.isPublic && prompt.requireApplication && !isAuthor) {
      if (!userId) {
        throw new ForbiddenException('请先登录后使用此提示词');
      }
      
      const hasPermission = await this.permissionService.checkPermission(
        id,
        userId,
        PermissionType.USE
      );
      
      if (!hasPermission) {
        throw new ForbiddenException('该提示词需要申请使用权限，请先提交申请');
      }
    }

    // 注意：
    // - 此接口返回配置信息，不包含content文本内容
    // - 提示词的具体内容（content文本）只有作者可以查看
    // - isContentPublic 字段只影响完整内容接口的访问

    // 如果内容不公开且非作者，提取参数列表
    let extractedParameters: any[] | undefined = undefined;
    if (!prompt.isContentPublic && !isAuthor && prompt.contents) {
      extractedParameters = [];
      prompt.contents.forEach(content => {
        if (content.isEnabled && content.parameters && content.parameters.length > 0) {
          extractedParameters!.push(...content.parameters);
        }
      });
    }

    // 返回配置信息（移除敏感的content文本）
    const result: any = {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      isPublic: prompt.isPublic,
      isContentPublic: prompt.isContentPublic,
      requireApplication: prompt.requireApplication,
      // 只返回作者的基本信息
      author: prompt.author ? {
        id: prompt.author.id,
        username: prompt.author.username,
        nickname: prompt.author.nickname,
        avatar: prompt.author.avatar,
      } : null,
      category: prompt.category,
    };

    // 如果内容不公开且非作者，只返回参数列表，不返回contents
    if (!prompt.isContentPublic && !isAuthor) {
      result.parameters = extractedParameters;
    } else {
      // 内容公开或作者访问，返回contents（不含content文本）
      result.contents = prompt.contents
        ?.filter(content => content.isEnabled) // 过滤掉未启用的内容
        .map(content => ({
          id: content.id,
          name: content.name,
          type: content.type,
          role: content.role,
          parameters: content.parameters,
          referenceId: content.referenceId,
          order: content.order,
          isEnabled: content.isEnabled,
          // 不返回 content 文本字段
        }));
    }

    return result;
  }

  async update(id: number, userId: number, updatePromptDto: UpdatePromptDto): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== userId) {
      throw new ForbiddenException('只有作者可以修改提示词');
    }

    const { contents, ...promptData } = updatePromptDto;

    // 🔒 检查是否需要管理员审核
    if (prompt.needsReview) {
      // 如果提示词被标记为需要审核，阻止作者直接发布或公开
      if (promptData.status === PromptStatus.PUBLISHED || promptData.isPublic === true) {
        throw new ForbiddenException('该提示词因违规被下架，需要提交管理员审核后才能重新发布。请先保存修改，然后点击"提交审核"按钮');
      }
      // 允许修改内容，但保持 needsReview 状态
      this.logger.log(`提示词 ${id} 正在审核中，允许修改但不能发布`);
    }

    // 更新提示词基本信息
    Object.assign(prompt, promptData);
    await this.promptRepository.save(prompt);

    // 如果提供了 contents，则更新内容
    if (contents !== undefined) {
      // 删除旧内容
      await this.contentRepository.delete({ promptId: id });
      
      // 添加新内容
      if (contents.length > 0) {
        const contentEntities = contents.map((content) =>
          this.contentRepository.create({
            ...content,
            promptId: id,
          }),
        );
        await this.contentRepository.save(contentEntities);
      }
    }

    return await this.findOne(id, userId, true);
  }

  async remove(id: number, userId: number): Promise<void> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== userId) {
      throw new ForbiddenException('只有作者可以删除提示词');
    }

    await this.promptRepository.softDelete(id);
  }

  async addContent(promptId: number, userId: number, contentData: Partial<PromptContent>): Promise<PromptContent> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== userId) {
      throw new ForbiddenException('只有作者可以添加内容');
    }

    const content = this.contentRepository.create({
      ...contentData,
      promptId,
    });

    return await this.contentRepository.save(content);
  }

  async updateContent(contentId: number, userId: number, contentData: Partial<PromptContent>): Promise<PromptContent> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['prompt'],
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    if (content.prompt.authorId !== userId) {
      throw new ForbiddenException('只有作者可以修改内容');
    }

    Object.assign(content, contentData);
    return await this.contentRepository.save(content);
  }

  async removeContent(contentId: number, userId: number): Promise<void> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['prompt'],
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    if (content.prompt.authorId !== userId) {
      throw new ForbiddenException('只有作者可以删除内容');
    }

    await this.contentRepository.delete(contentId);
  }

  async findMyPrompts(
    userId: number,
    categoryId?: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    data: Prompt[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const whereCondition: any = { authorId: userId };
    if (categoryId !== undefined) {
      whereCondition.categoryId = categoryId;
    }

    const skip = (page - 1) * pageSize;
    const queryBuilder = this.promptRepository
      .createQueryBuilder('prompt')
      .leftJoinAndSelect('prompt.category', 'category')
      .where(whereCondition)
      .orderBy('prompt.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [prompts, total] = await queryBuilder.getManyAndCount();

    if (prompts.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // 批量查询点赞、收藏状态和待审核申请数量
    const promptIds = prompts.map(p => p.id);
    const [likedMap, favoritedMap, pendingCountsMap] = await Promise.all([
      this.statsService.getBatchLikedStatus(promptIds, userId),
      this.statsService.getBatchFavoritedStatus(promptIds, userId),
      this.getBatchPendingApplicationsCounts(promptIds)
    ]);

    // 添加状态到每个提示词
    const data = prompts.map(prompt => ({
      ...prompt,
      isLiked: likedMap.get(prompt.id) || false,
      isFavorited: favoritedMap.get(prompt.id) || false,
      pendingApplicationsCount: pendingCountsMap.get(prompt.id) || 0,
    })) as Prompt[];

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
   * 批量查询待审核申请数量
   */
  private async getBatchPendingApplicationsCounts(promptIds: number[]): Promise<Map<number, number>> {
    const counts = await this.dataSource
      .getRepository('PromptApplication')
      .createQueryBuilder('application')
      .select('application.promptId', 'promptId')
      .addSelect('COUNT(*)', 'count')
      .where('application.promptId IN (:...promptIds)', { promptIds })
      .andWhere('application.status = :status', { status: 'pending' })
      .groupBy('application.promptId')
      .getRawMany();

    const countMap = new Map<number, number>();
    counts.forEach(({ promptId, count }) => {
      countMap.set(promptId, parseInt(count));
    });
    return countMap;
  }

  async findMyFavorites(userId: number, categoryId?: number): Promise<Prompt[]> {
    // 查询用户收藏的所有提示词ID
    const favorites = await this.promptFavoriteRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (favorites.length === 0) {
      return [];
    }

    const promptIds = favorites.map(f => f.promptId);

    // 构建查询条件
    const whereCondition: any = {
      id: In(promptIds),
      status: PromptStatus.PUBLISHED, // 只返回已发布的
      needsReview: false, // 过滤掉需要审核的
      isBanned: false, // 过滤掉被封禁的
    };
    if (categoryId !== undefined) {
      whereCondition.categoryId = categoryId;
    }

    // 查询这些提示词的详情
    const prompts = await this.promptRepository.find({
      where: whereCondition,
      relations: ['category', 'author'],
      order: { createdAt: 'DESC' },
    });

    if (prompts.length === 0) {
      return [];
    }

    // 批量查询点赞状态（收藏状态已知为true）
    const likedMap = await this.statsService.getBatchLikedStatus(promptIds, userId);

    // 添加状态到每个提示词
    return prompts.map(prompt => ({
      ...prompt,
      isFavorited: true,
      isLiked: likedMap.get(prompt.id) || false,
    })) as Prompt[];
  }

  /**
   * 批量更新提示词（用户自己的提示词）
   */
  async batchUpdate(userId: number, batchUpdateDto: BatchUpdatePromptsDto, isAdmin: boolean = false): Promise<{
    success: number;
    failed: number;
    errors: Array<{ promptId: number; error: string }>;
  }> {
    const { promptIds, isPublic, isContentPublic, requireApplication, isBanned } = batchUpdateDto;

    // 查询所有提示词
    const prompts = await this.promptRepository.find({
      where: { id: In(promptIds) },
    });

    const result = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ promptId: number; error: string }>,
    };

    for (const promptId of promptIds) {
      try {
        const prompt = prompts.find(p => p.id === promptId);
        
        if (!prompt) {
          result.failed++;
          result.errors.push({ promptId, error: '提示词不存在' });
          continue;
        }

        // 权限检查：非管理员只能更新自己的提示词
        if (!isAdmin && prompt.authorId !== userId) {
          result.failed++;
          result.errors.push({ promptId, error: '无权修改此提示词' });
          continue;
        }

        // 更新字段
        if (isPublic !== undefined) prompt.isPublic = isPublic;
        if (isContentPublic !== undefined) prompt.isContentPublic = isContentPublic;
        if (requireApplication !== undefined) prompt.requireApplication = requireApplication;
        
        // isBanned 只有管理员可以修改
        if (isBanned !== undefined && isAdmin) {
          prompt.isBanned = isBanned;
        }

        await this.promptRepository.save(prompt);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({ promptId, error: error.message });
      }
    }

    return result;
  }

  /**
   * 封禁提示词（管理员）
   */
  async banPrompt(promptId: number, banDto: BanPromptDto): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
      relations: ['author'],
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.isBanned) {
      throw new BadRequestException('该提示词已被封禁');
    }

    // 更新封禁状态
    prompt.isBanned = true;
    prompt.bannedReason = banDto.reason || '违反社区规范';
    prompt.bannedAt = new Date();

    const updatedPrompt = await this.promptRepository.save(prompt);

    // 🔔 通过 NotificationsService 通知作者（支持离线用户）
    try {
      await this.notificationsService.createAndPush({
        userId: prompt.authorId,
        title: '您的提示词已被封禁',
        content: `您的提示词「${prompt.name}」因违规已被封禁`,
        category: 'prompt-banned',
        level: 'error',
        action: {
          text: '查看详情',
          url: `/dashboard/prompts/${prompt.id}`,
        },
        extra: {
          promptId: prompt.id,
          promptName: prompt.name,
          reason: prompt.bannedReason,
          bannedAt: prompt.bannedAt,
        },
      });

      this.logger.log(`✅ 已发送封禁通知给用户 ${prompt.authorId}，提示词 ID: ${prompt.id}`);
    } catch (error) {
      this.logger.error(`发送封禁通知失败: ${error.message}`, error.stack);
    }

    return updatedPrompt;
  }

  /**
   * 解封提示词（管理员）
   */
  async unbanPrompt(promptId: number): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
      relations: ['author'],
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (!prompt.isBanned) {
      throw new BadRequestException('该提示词未被封禁');
    }

    // 更新封禁状态
    prompt.isBanned = false;
    prompt.bannedReason = null as any;
    prompt.bannedAt = null as any;

    const updatedPrompt = await this.promptRepository.save(prompt);

    // 🔔 通过 NotificationsService 通知作者（支持离线用户）
    try {
      await this.notificationsService.createAndPush({
        userId: prompt.authorId,
        title: '您的提示词已解封',
        content: `您的提示词「${prompt.name}」已恢复正常状态`,
        category: 'prompt-unbanned',
        level: 'success',
        action: {
          text: '查看详情',
          url: `/dashboard/prompts/${prompt.id}`,
        },
        extra: {
          promptId: prompt.id,
          promptName: prompt.name,
        },
      });

      this.logger.log(`✅ 已发送解封通知给用户 ${prompt.authorId}，提示词 ID: ${prompt.id}`);
    } catch (error) {
      this.logger.error(`发送解封通知失败: ${error.message}`, error.stack);
    }

    return updatedPrompt;
  }

  /**
   * 作者提交提示词审核
   */
  async submitForReview(id: number, userId: number): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ['contents'],
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (prompt.authorId !== userId) {
      throw new ForbiddenException('只有作者可以提交审核');
    }

    if (!prompt.needsReview) {
      throw new BadRequestException('该提示词不需要审核');
    }

    // 📋 确认快照已存在
    // 快照在举报通过时保存（记录违规内容）
    // 现在作者提交审核，管理员可以对比：快照（违规版本）vs 当前内容（修改后版本）
    if (!prompt.reviewSnapshot) {
      this.logger.warn(`提示词 ${id} 没有审核快照，这是异常情况`);
    }

    // 🕐 标记提交审核时间
    prompt.reviewSubmittedAt = new Date();
    const updatedPrompt = await this.promptRepository.save(prompt);

    this.logger.log(`✅ 用户 ${userId} 提交提示词 ${id} 审核，通知管理员`);

    // 🔔 通知所有管理员（汇总通知，避免轰炸）
    await this.notifyAdminsForReview();

    return updatedPrompt;
  }

  /**
   * 通知管理员有待审核的提示词（汇总通知）
   */
  private async notifyAdminsForReview(): Promise<void> {
    try {
      // 1. 统计当前已提交审核的提示词数量（不包括刚被举报还未修改的）
      const reviewCount = await this.promptRepository
        .createQueryBuilder('prompt')
        .where('prompt.needsReview = :needsReview', { needsReview: true })
        .andWhere('prompt.reviewSubmittedAt IS NOT NULL')
        .getCount();

      if (reviewCount === 0) {
        return;
      }

      // 2. 获取所有拥有提示词管理权限的管理员
      const adminIds = await this.usersService.getUsersWithPermission(
        PERMISSIONS.PROMPT.MANAGE_ALL,
      );

      if (adminIds.length === 0) {
        this.logger.warn('没有找到拥有提示词管理权限的管理员');
        return;
      }

      // 3. 给每个管理员发送一个汇总通知（替换旧通知，避免重复）
      for (const adminId of adminIds) {
        await this.notificationsService.createAndPush({
          userId: adminId,
          title: '提示词待审核',
          content: `当前有 ${reviewCount} 个提示词等待审核，请及时处理`,
          category: 'prompt-review-pending',
          level: 'info',
          extra: {
            count: reviewCount,
          },
        });
      }

      this.logger.log(`✅ 已通知 ${adminIds.length} 位管理员，待审核提示词数: ${reviewCount}`);
    } catch (error) {
      this.logger.error(`通知管理员失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 管理员拒绝提示词审核
   */
  async rejectPromptReview(id: number, reviewerId: number, rejectReason?: string): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (!prompt.needsReview) {
      throw new BadRequestException('该提示词不需要审核');
    }

    // 拒绝审核：保持 needsReview 状态，清除提交时间，让作者可以重新修改后再次提交
    prompt.reviewSubmittedAt = null;

    const updatedPrompt = await this.promptRepository.save(prompt);

    this.logger.log(`✅ 管理员 ${reviewerId} 拒绝提示词审核: ${id}`);

    // 🔔 通知提示词作者
    try {
      await this.notificationsService.createAndPush({
        userId: prompt.authorId,
        title: '提示词审核未通过',
        content: `您的提示词「${prompt.name}」未通过管理员审核${rejectReason ? '：' + rejectReason : ''}。请根据要求修改后重新提交审核。`,
        category: 'prompt-review-rejected',
        level: 'warning',
        action: {
          text: '去修改提示词',
          url: `/dashboard/prompts/${prompt.id}/edit`,
        },
        extra: {
          promptId: prompt.id,
          promptName: prompt.name,
          rejectReason,
        },
      });

      this.logger.log(`✅ 已发送审核拒绝通知给用户 ${prompt.authorId}，提示词 ID: ${prompt.id}`);
    } catch (error) {
      this.logger.error(`发送审核拒绝通知失败: ${error.message}`, error.stack);
    }

    return updatedPrompt;
  }

  /**
   * 管理员审核通过提示词（解除审核限制）
   */
  async approvePrompt(id: number, reviewerId: number, autoPublish: boolean = false, reviewNote?: string): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }

    if (!prompt.needsReview) {
      throw new BadRequestException('该提示词不需要审核');
    }

    // 解除审核限制并清除快照和提交时间
    prompt.needsReview = false;
    prompt.reviewSnapshot = null;
    prompt.reviewSubmittedAt = null;

    // 如果选择自动发布，则将提示词状态改为已发布并公开
    if (autoPublish) {
      prompt.status = PromptStatus.PUBLISHED;
      prompt.isPublic = true;
    }

    const updatedPrompt = await this.promptRepository.save(prompt);

    this.logger.log(`✅ 管理员 ${reviewerId} 审核通过提示词: ${id}, 自动发布: ${autoPublish}`);

    // 🔔 通知提示词作者
    try {
      await this.notificationsService.createAndPush({
        userId: prompt.authorId,
        title: autoPublish ? '您的提示词已审核通过并发布' : '您的提示词已审核通过',
        content: autoPublish 
          ? `您的提示词「${prompt.name}」已通过管理员审核并自动发布` 
          : `您的提示词「${prompt.name}」已通过管理员审核，您可以自行发布`,
        category: 'prompt-approved',
        level: 'success',
        action: {
          text: '查看详情',
          url: `/dashboard/prompts/${prompt.id}`,
        },
        extra: {
          promptId: prompt.id,
          promptName: prompt.name,
          autoPublish,
          reviewNote,
        },
      });

      this.logger.log(`✅ 已发送审核通过通知给用户 ${prompt.authorId}，提示词 ID: ${prompt.id}`);
    } catch (error) {
      this.logger.error(`发送审核通过通知失败: ${error.message}`, error.stack);
    }

    return updatedPrompt;
  }

  /**
   * 获取所有提示词列表（管理员用）
   */
  async findAllForAdmin(queryPromptDto: QueryPromptDto): Promise<{
    data: Prompt[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      isPublic,
      authorId,
      keyword,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryPromptDto;

    const skip = (page - 1) * pageSize;
    const queryBuilder = this.promptRepository
      .createQueryBuilder('prompt')
      .leftJoin('prompt.author', 'author')
      .addSelect(['author.id', 'author.username', 'author.nickname', 'author.avatar'])
      .leftJoinAndSelect('prompt.category', 'category');

    // 管理员可以看到所有提示词，不受isPublic限制

    if (categoryId !== undefined) {
      queryBuilder.andWhere('prompt.categoryId = :categoryId', { categoryId });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('prompt.isPublic = :isPublic', { isPublic });
    }

    if (authorId !== undefined) {
      queryBuilder.andWhere('prompt.authorId = :authorId', { authorId });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('prompt.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(prompt.name LIKE :keyword OR prompt.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const validSortFields = ['hotValue', 'createdAt', 'viewCount', 'useCount', 'likeCount', 'isBanned'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`prompt.${sortField}`, sortOrder);

    const [data, total] = await queryBuilder.skip(skip).take(pageSize).getManyAndCount();

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
}
