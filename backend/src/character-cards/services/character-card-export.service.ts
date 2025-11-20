import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharacterCard } from '../entities/character-card.entity';
import { CharacterCardConverterService } from './character-card-converter.service';
import { PngMetadataService } from './png-metadata.service';
import { ExportCharacterCardDto } from '../dto';
import { CharacterCardSpec } from '../enums';

/**
 * 角色卡导出服务
 * 支持导出为 JSON 和 PNG 格式
 */
@Injectable()
export class CharacterCardExportService {
  constructor(
    @InjectRepository(CharacterCard)
    private readonly characterCardRepository: Repository<CharacterCard>,
    private readonly converterService: CharacterCardConverterService,
    private readonly pngMetadataService: PngMetadataService,
  ) {}

  /**
   * 导出角色卡
   */
  async export(
    id: number,
    exportDto: ExportCharacterCardDto,
    userId?: number,
  ): Promise<{ data: any; mimeType: string; filename: string }> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    // 权限检查
    if (!card.isPublic && card.authorId !== userId) {
      throw new NotFoundException('角色卡不存在');
    }

    let exportData = card.data;

    // 格式转换（如果需要）
    if (exportDto.targetSpec && exportDto.targetSpec !== card.spec) {
      if (exportDto.targetSpec === CharacterCardSpec.V1) {
        exportData = this.converterService.convertV2ToV1(card.data as any);
      }
    }

    // 处理世界书
    if (!exportDto.includeWorldBook && typeof exportData === 'object') {
      const dataCopy = JSON.parse(JSON.stringify(exportData));
      if (dataCopy.data?.character_book) {
        delete dataCopy.data.character_book;
      }
      exportData = dataCopy;
    }

    if (exportDto.format === 'png') {
      // 如果有存储的 PNG 数据，直接返回
      if (card.pngData) {
        return {
          data: card.pngData,
          mimeType: 'image/png',
          filename: `${card.name}.png`,
        };
      }

      // 否则生成新的 PNG（需要立绘图片）
      if (card.avatarUrl) {
        const pngData = await this.embedDataIntoPng(card.avatarUrl, exportData, card.spec);
        return {
          data: pngData,
          mimeType: 'image/png',
          filename: `${card.name}.png`,
        };
      }

      // 降级为 JSON
      return {
        data: JSON.stringify(exportData, null, 2),
        mimeType: 'application/json',
        filename: `${card.name}.json`,
      };
    }

    // JSON 格式
    return {
      data: JSON.stringify(exportData, null, 2),
      mimeType: 'application/json',
      filename: `${card.name}.json`,
    };
  }

  /**
   * 将角色卡数据嵌入 PNG 图片的 tEXt 元数据中
   */
  private async embedDataIntoPng(
    imageUrl: string,
    cardData: any,
    spec: CharacterCardSpec,
  ): Promise<string> {
    // 确定关键字：V3 使用 ccv3，其他使用 chara
    const keyword = spec === CharacterCardSpec.V3 ? 'ccv3' : 'chara';

    // 使用 PngMetadataService 嵌入数据
    return await this.pngMetadataService.embedDataIntoPng(imageUrl, cardData, keyword);
  }
}
