import { Injectable, BadRequestException } from '@nestjs/common';
import { CharacterCardConverterService } from './character-card-converter.service';
import { CharacterCardsService } from './character-cards.service';
import { PngMetadataService } from './png-metadata.service';
import { ImportCharacterCardDto } from '../dto';
import { CharacterCard } from '../entities/character-card.entity';
import { CharacterCardSpec } from '../enums';

/**
 * 角色卡导入服务
 * 支持从 PNG 文件和 JSON 导入
 */
@Injectable()
export class CharacterCardImportService {
  constructor(
    private readonly converterService: CharacterCardConverterService,
    private readonly characterCardsService: CharacterCardsService,
    private readonly pngMetadataService: PngMetadataService,
  ) {}

  /**
   * 导入角色卡
   */
  async import(importDto: ImportCharacterCardDto, userId: number): Promise<CharacterCard> {
    let cardData: any;

    if (importDto.pngData) {
      // 从 PNG 导入
      cardData = this.extractFromPng(importDto.pngData);
    } else if (importDto.jsonData) {
      // 从 JSON 导入
      try {
        cardData = JSON.parse(importDto.jsonData);
      } catch (error) {
        throw new BadRequestException('无效的 JSON 数据');
      }
    } else {
      throw new BadRequestException('必须提供 pngData 或 jsonData');
    }

    // 验证并规范化为 V2 格式
    const normalizedCard = this.converterService.normalizeToV2(cardData);

    // 提取基本信息
    const basicInfo = this.converterService.extractBasicInfo(normalizedCard);

    // 处理自定义标签
    let tags = basicInfo.tags || [];
    if (importDto.tags) {
      const customTags = importDto.tags.split(',').map(t => t.trim());
      tags = [...new Set([...tags, ...customTags])];
    }

    // 创建角色卡
    return await this.characterCardsService.create(
      {
        name: basicInfo.name,
        description: basicInfo.description,
        spec: normalizedCard.spec as CharacterCardSpec,
        specVersion: normalizedCard.spec_version as any,
        data: normalizedCard.data,
        avatarUrl: undefined,
        pngData: importDto.pngData,
        isPublic: importDto.isPublic ?? true,
        tags,
        category: importDto.category,
      },
      userId,
    );
  }

  /**
   * 从 PNG 的 tEXt 元数据中提取角色卡数据
   */
  private extractFromPng(base64Data: string): any {
    try {
      // 移除 data URL 前缀（如果存在）
      const pngData = base64Data.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(pngData, 'base64');

      // V3 优先
      let text = this.pngMetadataService.extractTextChunk(buffer, 'ccv3');
      
      if (!text) {
        // 尝试 V2
        text = this.pngMetadataService.extractTextChunk(buffer, 'chara');
      }

      if (!text) {
        throw new BadRequestException('PNG 文件中未找到角色卡数据（缺少 chara 或 ccv3 元数据）');
      }

      // 解码 Base64
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('解析 PNG 文件失败: ' + error.message);
    }
  }
}
