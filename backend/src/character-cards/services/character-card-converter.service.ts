import { Injectable } from '@nestjs/common';
import { CharacterCardV1, CharacterCardV2, CharacterCardV2Data } from '../interfaces';
import { CharacterCardSpec, CharacterCardSpecVersion } from '../enums';

/**
 * 角色卡格式转换服务
 * 负责不同版本角色卡格式之间的转换
 */
@Injectable()
export class CharacterCardConverterService {
  /**
   * V1 转 V2
   */
  convertV1ToV2(v1Data: CharacterCardV1): CharacterCardV2 {
    const v2Data: CharacterCardV2Data = {
      name: v1Data.name,
      description: v1Data.description,
      personality: v1Data.personality,
      scenario: v1Data.scenario,
      first_mes: v1Data.first_mes,
      mes_example: v1Data.mes_example,
      creator_notes: v1Data.creatorcomment,
      tags: v1Data.tags,
      extensions: {
        talkativeness: v1Data.talkativeness,
        fav: typeof v1Data.fav === 'boolean' ? v1Data.fav : v1Data.fav === 'true',
      },
    };

    return {
      spec: CharacterCardSpec.V2,
      spec_version: CharacterCardSpecVersion.V2,
      data: v2Data,
    };
  }

  /**
   * V2 转 V1（降级）
   */
  convertV2ToV1(v2Data: CharacterCardV2): CharacterCardV1 {
    const data = v2Data.data;
    
    return {
      name: data.name,
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      first_mes: data.first_mes,
      mes_example: data.mes_example,
      creatorcomment: data.creator_notes,
      tags: data.tags,
      talkativeness: data.extensions?.talkativeness,
      fav: data.extensions?.fav,
      create_date: new Date().toISOString(),
    };
  }

  /**
   * 验证角色卡数据
   */
  validateCharacterCard(data: any): {
    isValid: boolean;
    spec: CharacterCardSpec;
    errors: string[];
  } {
    const errors: string[] = [];

    // 检测版本
    if (data.spec === CharacterCardSpec.V2 || data.spec === CharacterCardSpec.V3) {
      // V2/V3 格式
      if (!data.data) {
        errors.push('缺少 data 字段');
      } else {
        this.validateV2Data(data.data, errors);
      }

      return {
        isValid: errors.length === 0,
        spec: data.spec,
        errors,
      };
    } else {
      // 假定为 V1 格式
      this.validateV1Data(data, errors);

      return {
        isValid: errors.length === 0,
        spec: CharacterCardSpec.V1,
        errors,
      };
    }
  }

  /**
   * 验证 V2 数据
   */
  private validateV2Data(data: CharacterCardV2Data, errors: string[]): void {
    const requiredFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }
  }

  /**
   * 验证 V1 数据
   */
  private validateV1Data(data: CharacterCardV1, errors: string[]): void {
    const requiredFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }
  }

  /**
   * 规范化角色卡数据（统一转为 V2）
   */
  normalizeToV2(data: any): CharacterCardV2 {
    const validation = this.validateCharacterCard(data);

    if (!validation.isValid) {
      throw new Error(`角色卡数据验证失败: ${validation.errors.join(', ')}`);
    }

    if (validation.spec === CharacterCardSpec.V1) {
      return this.convertV1ToV2(data as CharacterCardV1);
    }

    return data as CharacterCardV2;
  }

  /**
   * 提取角色卡基本信息（用于列表显示）
   */
  extractBasicInfo(data: any): {
    name: string;
    description: string;
    tags: string[];
  } {
    if (data.spec === CharacterCardSpec.V2 || data.spec === CharacterCardSpec.V3) {
      return {
        name: data.data.name,
        description: data.data.description,
        tags: data.data.tags || [],
      };
    } else {
      return {
        name: data.name,
        description: data.description,
        tags: data.tags || [],
      };
    }
  }
}
