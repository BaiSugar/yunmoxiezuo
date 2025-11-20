import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import OpenAI from 'openai';
import axios, { AxiosError } from 'axios';
import { AiModel, ModelStatus } from '../entities';
import {
  CreateModelDto,
  UpdateModelDto,
  ModelBasicDto,
  TestModelConnectionDto,
} from '../dto';
import { AiProvidersService } from './ai-providers.service';
import { ModelCategoriesService } from './model-categories.service';
import { ChatCompletionSource } from '../types';

/**
 * AI 模型服务
 */
@Injectable()
export class AiModelsService {
  constructor(
    @InjectRepository(AiModel)
    private readonly modelRepository: Repository<AiModel>,
    private readonly providersService: AiProvidersService,
    private readonly categoriesService: ModelCategoriesService,
  ) {}

  private readonly TEST_TIMEOUT = 20000;
  private readonly TEST_USER_AGENT = 'Xiezuo-AdminTest/1.0';

  /**
   * 创建模型
   */
  async create(createDto: CreateModelDto, userId?: number): Promise<AiModel> {
    // 验证提供商是否存在
    await this.providersService.findOne(createDto.providerId, userId);

    // 如果指定了分类，验证分类是否存在
    if (createDto.categoryId) {
      await this.categoriesService.findOne(createDto.categoryId);
    }

    // 检查模型ID是否已存在于该提供商下
    const existing = await this.modelRepository.findOne({
      where: {
        modelId: createDto.modelId,
        providerId: createDto.providerId,
      },
    });

    if (existing) {
      throw new ConflictException('该提供商下已存在相同的模型标识符');
    }

    // 如果设置为默认，取消其他默认模型
    if (createDto.isDefault) {
      await this.clearDefaultModel(userId);
    }

    const model = this.modelRepository.create({
      ...createDto,
      userId,
    });

    return await this.modelRepository.save(model);
  }

  /**
   * 查询所有模型
   */
  async findAll(userId?: number): Promise<AiModel[]> {
    const where = userId
      ? [{ userId }, { userId: IsNull() }]
      : { userId: IsNull() };

    return await this.modelRepository.find({
      where,
      relations: ['provider', 'category'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 根据提供商ID查询模型
   */
  async findByProvider(
    providerId: number,
    userId?: number,
  ): Promise<AiModel[]> {
    const where: any = { providerId };
    if (userId) {
      where.userId = userId;
    }

    return await this.modelRepository.find({
      where,
      relations: ['provider', 'category'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID查询模型
   * 注意：所有用户都可以查看模型详情
   */
  async findOne(id: number, userId?: number): Promise<AiModel> {
    const model = await this.modelRepository.findOne({
      where: { id },
      relations: ['provider', 'category'],
    });

    if (!model) {
      throw new NotFoundException('模型不存在');
    }

    return model;
  }

  /**
   * 根据模型标识符查询
   * 注意：所有用户都可以查看模型详情
   */
  async findByModelId(modelId: string, userId?: number): Promise<AiModel> {
    const model = await this.modelRepository.findOne({
      where: { modelId },
      relations: ['provider', 'category'],
    });

    if (!model) {
      throw new NotFoundException('模型不存在');
    }

    return model;
  }

  /**
   * 获取默认模型
   * 注意：默认模型对所有用户可见
   */
  async findDefault(userId?: number): Promise<AiModel | null> {
    return await this.modelRepository.findOne({
      where: { isDefault: true, status: ModelStatus.ACTIVE },
      relations: ['provider', 'category'],
    });
  }

  /**
   * 获取活跃的模型列表
   * 注意：AI 模型对所有用户可见，不限制所有权
   */
  async findActive(userId?: number): Promise<AiModel[]> {
    // 查询所有活跃的模型，不限制 userId
    // AI 模型应该对所有用户开放，让用户可以选择使用
    const models = await this.modelRepository.find({
      where: { status: ModelStatus.ACTIVE },
      relations: ['provider', 'category'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    return models;
  }

  /**
   * 获取活跃模型的基本信息（不包含敏感信息，用于前端选择器）
   */
  async findActiveBasic(userId?: number): Promise<ModelBasicDto[]> {
    const models = await this.findActive(userId);

    // 只返回基本信息，过滤掉敏感字段（包括modelId），添加供应商信息
    return models.map((model) => ({
      id: model.id,
      displayName: model.displayName,
      description: model.description,
      isDefault: model.isDefault,
      providerId: model.providerId,
      providerName: model.provider?.displayName || model.provider?.name || '未知供应商',
      categoryId: model.categoryId ?? undefined,
      categoryName: model.category?.name || (model.categoryId ? '未命名分类' : '未分类'),
      categoryIcon: model.category?.icon ?? undefined,
      categoryDescription: model.category?.description ?? undefined,
      categoryOrder: model.category?.order ?? undefined,
      isFree: model.isFree,
      inputRatio: model.inputRatio,
      outputRatio: model.outputRatio,
    }));
  }

  /**
   * 测试模型连接（使用当前配置或临时参数）
   */
  async testConnection(
    testDto: TestModelConnectionDto,
    userId?: number,
  ): Promise<void> {
    const provider = await this.providersService.getProviderEntity(
      testDto.providerId,
      userId,
    );

    if (!provider) {
      throw new NotFoundException('提供商不存在');
    }

    const baseUrl =
      (testDto.baseUrl && testDto.baseUrl.trim()) ||
      provider.config?.baseUrl ||
      '';

    if (!baseUrl) {
      throw new BadRequestException('请先配置 API Base URL');
    }

    let apiKey = testDto.apiKey?.trim();
    if (!apiKey) {
      apiKey = provider.getDecryptedApiKey() || undefined;
    }

    if (!apiKey) {
      throw new BadRequestException('请先配置 API Key');
    }

    try {
      if (provider.source === ChatCompletionSource.CLAUDE) {
        await this.testClaudeEndpoint(
          baseUrl,
          apiKey,
          testDto.modelId,
          provider.config?.headers,
        );
      } else {
        await this.testOpenAICompatibleEndpoint(
          baseUrl,
          apiKey,
          testDto.modelId,
          provider.config?.headers,
        );
      }
    } catch (error) {
      const message = this.extractTestError(error);
      throw new BadRequestException(`连接失败：${message}`);
    }
  }

  /**
   * 更新模型
   */
  async update(
    id: number,
    updateDto: UpdateModelDto,
    userId?: number,
  ): Promise<AiModel> {
    const model = await this.findOne(id, userId);

    // 检查用户是否有权限修改
    if (model.userId !== userId && model.userId !== null) {
      throw new BadRequestException('无权修改此模型');
    }

    // 如果修改提供商，验证新提供商是否存在
    if (updateDto.providerId && updateDto.providerId !== model.providerId) {
      await this.providersService.findOne(updateDto.providerId, userId);
    }

    // 如果修改分类，验证分类是否存在
    if (updateDto.categoryId !== undefined) {
      if (updateDto.categoryId !== null) {
        await this.categoriesService.findOne(updateDto.categoryId);
      }
    }

    // 如果修改模型ID，检查是否冲突
    if (updateDto.modelId && updateDto.modelId !== model.modelId) {
      const existing = await this.modelRepository.findOne({
        where: {
          modelId: updateDto.modelId,
          providerId: updateDto.providerId || model.providerId,
        },
      });
      if (existing && existing.id !== model.id) {
        throw new ConflictException('该提供商下已存在相同的模型标识符');
      }
    }

    // 如果设置为默认，取消其他默认模型
    if (updateDto.isDefault && !model.isDefault) {
      await this.clearDefaultModel(userId);
    }

    Object.assign(model, updateDto);
    return await this.modelRepository.save(model);
  }

  /**
   * 删除模型
   */
  async remove(id: number, userId?: number): Promise<void> {
    const model = await this.findOne(id, userId);

    // 检查用户是否有权限删除
    if (model.userId !== userId && model.userId !== null) {
      throw new BadRequestException('无权删除此模型');
    }

    await this.modelRepository.remove(model);
  }

  /**
   * 批量导入模型
   */
  async bulkImport(
    providerId: number,
    models: Partial<CreateModelDto>[],
    userId?: number,
  ): Promise<AiModel[]> {
    // 验证提供商是否存在
    await this.providersService.findOne(providerId, userId);

    const createdModels: AiModel[] = [];

    for (const modelData of models) {
      try {
        const model = await this.create(
          {
            ...modelData,
            providerId,
          } as CreateModelDto,
          userId,
        );
        createdModels.push(model);
      } catch (error) {
        // 忽略已存在的模型，继续导入其他模型
        if (!(error instanceof ConflictException)) {
          throw error;
        }
      }
    }

    return createdModels;
  }

  /**
   * 清除默认模型标记
   */
  private async clearDefaultModel(userId?: number): Promise<void> {
    // 查找需要更新的模型
    const where = userId
      ? [{ isDefault: true, userId }, { isDefault: true, userId: IsNull() }]
      : { isDefault: true, userId: IsNull() };

    const models = await this.modelRepository.find({ where });
    
    // 批量更新
    if (models.length > 0) {
      await this.modelRepository.update(
        models.map(m => m.id),
        { isDefault: false },
      );
    }
  }

  /**
   * 统计模型数量
   */
  async count(userId?: number): Promise<number> {
    const where = userId
      ? [{ userId }, { userId: IsNull() }]
      : { userId: IsNull() };

    return await this.modelRepository.count({ where });
  }

  /**
   * 根据特性查询模型
   */
  async findByFeatures(
    features: string[],
    userId?: number,
  ): Promise<AiModel[]> {
    const query = this.modelRepository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.provider', 'provider')
      .where('model.status = :status', { status: ModelStatus.ACTIVE });

    if (userId) {
      query.andWhere('(model.userId = :userId OR model.userId IS NULL)', {
        userId,
      });
    } else {
      query.andWhere('model.userId IS NULL');
    }

    // 查询包含指定特性的模型
    for (const feature of features) {
      query.andWhere(':feature = ANY(model.features)', { feature });
    }

    return await query
      .leftJoinAndSelect('model.category', 'category')
      .orderBy('model.order', 'ASC')
      .getMany();
  }

  /**
   * 根据分类ID查询模型
   */
  async findByCategory(
    categoryId: number,
    userId?: number,
  ): Promise<AiModel[]> {
    const where: any = { categoryId };
    if (userId) {
      where.userId = userId;
    }

    return await this.modelRepository.find({
      where,
      relations: ['provider', 'category'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  private async testOpenAICompatibleEndpoint(
    baseUrl: string,
    apiKey: string,
    modelId: string,
    extraHeaders?: Record<string, string>,
  ) {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      timeout: this.TEST_TIMEOUT,
      maxRetries: 0,
      defaultHeaders: {
        'User-Agent': this.TEST_USER_AGENT,
        ...(extraHeaders || {}),
      },
    });

    await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: 'Health check, please reply with OK.' },
        { role: 'user', content: 'Say OK' },
      ],
      max_tokens: 1,
      temperature: 0,
      stream: false,
    } as any);
  }

  private async testClaudeEndpoint(
    baseUrl: string,
    apiKey: string,
    modelId: string,
    extraHeaders?: Record<string, string>,
  ) {
    const url = `${baseUrl.replace(/\/$/, '')}/v1/messages`;
    await axios.post(
      url,
      {
        model: modelId,
        max_tokens: 64,
        messages: [{ role: 'user', content: 'Say OK' }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version':
            extraHeaders?.['anthropic-version'] || '2023-06-01',
          'User-Agent': this.TEST_USER_AGENT,
          ...(extraHeaders || {}),
        },
        timeout: this.TEST_TIMEOUT,
      },
    );
  }

  private extractTestError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        error?: { message?: string };
        message?: string;
      }>;
      return (
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.message ||
        axiosError.message
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return '未知错误';
  }
}
