import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModelPreference } from './entities/user-model-preference.entity';
import { AiModel, ModelStatus } from '../ai-models/entities/ai-model.entity';
import {
  CreateUserModelPreferenceDto,
  UpdateUserModelPreferenceDto,
} from './dto/user-model-preference.dto';

@Injectable()
export class UserModelPreferencesService {
  constructor(
    @InjectRepository(UserModelPreference)
    private readonly preferenceRepository: Repository<UserModelPreference>,
    @InjectRepository(AiModel)
    private readonly aiModelRepository: Repository<AiModel>,
  ) {}

  /**
   * 创建或更新用户模型偏好设置
   * 
   * 策略：每次保存时删除所有旧配置，只保留最新的一个
   * （因为用户每次生成只使用一个模型配置）
   */
  async createOrUpdate(
    userId: number,
    createDto: CreateUserModelPreferenceDto,
  ): Promise<UserModelPreference> {
    console.log(`\n========== 保存模型配置（覆盖模式）==========`);
    console.log(`用户: ${userId}, 模型: ${createDto.modelId}`);
    console.log(`温度: ${createDto.temperature}, 历史限制: ${createDto.historyMessageLimit}`);
    
    // 1. 删除该用户的所有旧配置
    const deleteResult = await this.preferenceRepository.delete({ userId });
    console.log(`✓ 已删除 ${deleteResult.affected || 0} 条旧配置`);
    
    // 2. 创建新配置
    const preference = this.preferenceRepository.create({
      userId,
      modelId: createDto.modelId,
      temperature: createDto.temperature,
      historyMessageLimit: createDto.historyMessageLimit,
    });
    
    const saved = await this.preferenceRepository.save(preference);
    
    console.log(`✓ 新配置已保存: ID=${saved.id}, 模型=${saved.modelId}, 温度=${saved.temperature}`);
    console.log(`========== 保存完成 ==========\n`);
    
    return saved;
  }

  /**
   * 获取用户所有模型偏好设置
   * 按更新时间降序排序（最新的在前面）
   */
  async findAll(userId: number): Promise<UserModelPreference[]> {
    const preferences = await this.preferenceRepository.find({ 
      where: { userId },
      order: { updatedAt: 'DESC' }, // 最新更新的在前面
    });
    
    console.log(`\n📋 [UserModelPreferences] findAll - 用户 ${userId}:`);
    preferences.forEach((pref, index) => {
      console.log(`  ${index + 1}. 模型${pref.modelId}, 温度=${pref.temperature}, 更新时间=${pref.updatedAt}`);
    });
    console.log('');
    
    return preferences;
  }

  /**
   * 获取用户对指定模型的偏好设置
   * 新用户首次请求时，会自动创建一个默认配置（选择非免费且启用的模型）
   */
  async findByModel(
    userId: number,
    modelId: number,
  ): Promise<UserModelPreference> {
    // 先查找用户是否有任何偏好设置
    const existingPreferences = await this.preferenceRepository.find({ 
      where: { userId },
      take: 1,
    });

    // 如果用户没有任何偏好设置，为其创建一个默认的（选择非免费模型）
    if (existingPreferences.length === 0) {
      // 查找第一个非免费且已启用的模型
      const nonFreeModel = await this.aiModelRepository.findOne({
        where: { 
          status: ModelStatus.ACTIVE,
          isFree: false,
        },
        order: {
          isDefault: 'DESC', // 优先选择默认模型
          order: 'ASC',      // 其次按排序字段
          id: 'ASC',         // 最后按ID
        },
      });

      if (!nonFreeModel) {
        throw new NotFoundException('未找到可用的非免费模型，无法创建默认配置');
      }

      // 创建默认偏好设置（temperature 默认为 1）
      const defaultPreference = this.preferenceRepository.create({
        userId,
        modelId: nonFreeModel.id,
        temperature: 1,
      });
      
      await this.preferenceRepository.save(defaultPreference);
    }

    // 查找并返回用户对指定模型的偏好设置
    const preference = await this.preferenceRepository.findOne({ 
      where: { userId, modelId } 
    });

    if (!preference) {
      throw new NotFoundException('未找到该模型的偏好设置');
    }

    return preference;
  }

  /**
   * 更新偏好设置
   */
  async update(
    id: number,
    userId: number,
    updateDto: UpdateUserModelPreferenceDto,
  ): Promise<UserModelPreference> {
    const preference = await this.preferenceRepository.findOne({
      where: { id, userId },
    });

    if (!preference) {
      throw new Error('Preference not found');
    }

    preference.temperature = updateDto.temperature;
    if (updateDto.historyMessageLimit !== undefined) {
      preference.historyMessageLimit = updateDto.historyMessageLimit;
    }
    return this.preferenceRepository.save(preference);
  }

  /**
   * 删除偏好设置
   */
  async delete(id: number, userId: number): Promise<void> {
    await this.preferenceRepository.delete({ id, userId });
  }

  /**
   * 获取用户偏好配置（用于生成服务）
   * 如果用户未保存偏好，返回默认值
   */
  async getPreferenceForGeneration(
    userId: number,
    modelIdStr: string,
  ): Promise<{ 
    temperature: number; 
    historyMessageLimit: number;
    modelDatabaseId: number | null; // 模型的数据库ID
  }> {
    console.log(`[getPreferenceForGeneration] 开始查询模型, userId=${userId}, modelIdStr=${modelIdStr}`);
    
    let aiModel: any = null;
    
    // 1. 判断是数字ID还是字符串标识符
    const isNumericId = /^\d+$/.test(modelIdStr);
    
    if (isNumericId) {
      // 按数字ID查询（前端传来的数据库ID）
      console.log(`[getPreferenceForGeneration] 按数字ID查询: ${modelIdStr}`);
      aiModel = await this.aiModelRepository.findOne({
        where: { id: parseInt(modelIdStr, 10) },
        select: ['id', 'modelId', 'status'],
      });
    } else {
      // 按字符串标识符查询（如 "gemini-2.5-pro"）
      console.log(`[getPreferenceForGeneration] 按字符串查询: ${modelIdStr}`);
      aiModel = await this.aiModelRepository.findOne({
        where: { modelId: modelIdStr },
        select: ['id', 'modelId', 'status'],
      });
    }

    console.log(`[getPreferenceForGeneration] 模型查询结果: aiModel=${!!aiModel}, id=${aiModel?.id}, status=${aiModel?.status}`);

    if (!aiModel) {
      // 模型不存在，返回默认值
      console.warn(`[getPreferenceForGeneration] ⚠️ 模型 ${modelIdStr} 不存在，返回默认值`);
      return {
        temperature: 0.7,
        historyMessageLimit: 10,
        modelDatabaseId: null,
      };
    }

    // 2. 查找用户对该模型的偏好设置
    const preference = await this.preferenceRepository.findOne({
      where: { userId, modelId: aiModel.id },
    });

    if (!preference) {
      // 用户未保存偏好，返回默认值
      return {
        temperature: 0.7,
        historyMessageLimit: 10,
        modelDatabaseId: aiModel.id,
      };
    }

    // 3. 返回用户保存的偏好（如果某些字段未设置，使用默认值）
    return {
      temperature: preference.temperature ?? 0.7,
      historyMessageLimit: preference.historyMessageLimit ?? 10,
      modelDatabaseId: aiModel.id,
    };
  }
}
