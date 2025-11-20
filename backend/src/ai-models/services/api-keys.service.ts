import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyStatus } from '../entities/api-key.entity';

/**
 * API Key 管理服务
 */
@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * 创建 API Key
   */
  async create(data: {
    providerId: number;
    name: string;
    key: string;
    weight?: number;
    priority?: number;
    requestsPerMinute?: number;
    tokensPerMinute?: number;
    notes?: string;
  }): Promise<ApiKey> {
    const apiKey = this.apiKeyRepository.create({
      ...data,
      status: ApiKeyStatus.ACTIVE,
    });

    return await this.apiKeyRepository.save(apiKey);
  }

  /**
   * 查询所有 API Keys
   */
  async findAll(providerId?: number): Promise<ApiKey[]> {
    const where = providerId ? { providerId } : {};
    
    return await this.apiKeyRepository.find({
      where,
      relations: ['provider'],
      order: {
        priority: 'ASC',
        weight: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 根据ID查询 API Key
   */
  async findOne(id: number): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!apiKey) {
      throw new NotFoundException(`API Key ${id} 不存在`);
    }

    return apiKey;
  }

  /**
   * 根据提供商ID查询 API Keys
   */
  async findByProvider(providerId: number): Promise<ApiKey[]> {
    return await this.apiKeyRepository.find({
      where: { providerId },
      order: {
        priority: 'ASC',
        weight: 'DESC',
      },
    });
  }

  /**
   * 更新 API Key
   */
  async update(
    id: number,
    data: {
      name?: string;
      key?: string;
      status?: ApiKeyStatus;
      weight?: number;
      priority?: number;
      requestsPerMinute?: number;
      tokensPerMinute?: number;
      notes?: string;
    },
  ): Promise<ApiKey> {
    const apiKey = await this.findOne(id);

    Object.assign(apiKey, data);

    return await this.apiKeyRepository.save(apiKey);
  }

  /**
   * 删除 API Key
   */
  async remove(id: number): Promise<void> {
    const apiKey = await this.findOne(id);
    await this.apiKeyRepository.remove(apiKey);
  }

  /**
   * 启用/禁用 API Key
   */
  async toggleStatus(id: number): Promise<ApiKey> {
    const apiKey = await this.findOne(id);

    apiKey.status =
      apiKey.status === ApiKeyStatus.ACTIVE
        ? ApiKeyStatus.INACTIVE
        : ApiKeyStatus.ACTIVE;

    return await this.apiKeyRepository.save(apiKey);
  }

  /**
   * 批量创建 API Keys
   */
  async bulkCreate(
    providerId: number,
    keys: Array<{
      name: string;
      key: string;
      weight?: number;
      priority?: number;
    }>,
  ): Promise<ApiKey[]> {
    const apiKeys = keys.map(keyData =>
      this.apiKeyRepository.create({
        providerId,
        ...keyData,
        status: ApiKeyStatus.ACTIVE,
      }),
    );

    return await this.apiKeyRepository.save(apiKeys);
  }

  /**
   * 统计提供商的 API Keys 数量
   */
  async count(providerId?: number): Promise<number> {
    const where = providerId ? { providerId } : {};
    return await this.apiKeyRepository.count({ where });
  }

  /**
   * 获取提供商的活跃 Keys 数量
   */
  async countActive(providerId: number): Promise<number> {
    return await this.apiKeyRepository.count({
      where: {
        providerId,
        status: ApiKeyStatus.ACTIVE,
      },
    });
  }
}
