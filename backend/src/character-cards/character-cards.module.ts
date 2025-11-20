import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterCard } from './entities/character-card.entity';
import { CharacterCardLike } from './entities/character-card-like.entity';
import { CharacterCardFavorite } from './entities/character-card-favorite.entity';
import { CharacterCardsController } from './controllers/character-cards.controller';
import {
  CharacterCardsService,
  CharacterCardConverterService,
  CharacterCardImportService,
  CharacterCardExportService,
  PngMetadataService,
} from './services';

/**
 * 角色卡模块
 * 提供 SillyTavern 角色卡管理功能
 * 
 * 核心功能：
 * - 角色卡 CRUD 操作
 * - 格式转换（V1/V2/V3）
 * - 导入导出（JSON/PNG）
 * - 点赞、收藏、统计
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CharacterCard,
      CharacterCardLike,
      CharacterCardFavorite,
    ]),
  ],
  controllers: [CharacterCardsController],
  providers: [
    CharacterCardsService,
    CharacterCardConverterService,
    CharacterCardImportService,
    CharacterCardExportService,
    PngMetadataService,
  ],
  exports: [
    CharacterCardsService,
    CharacterCardConverterService,
    CharacterCardImportService,
    CharacterCardExportService,
    PngMetadataService,
  ],
})
export class CharacterCardsModule {}
