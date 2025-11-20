import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Novel } from './entities/novel.entity';
import { Volume } from './entities/volume.entity';
import { Chapter } from './entities/chapter.entity';
import { ChapterVersion } from './entities/chapter-version.entity';
import { Character } from './entities/character.entity';
import { WorldSetting } from './entities/world-setting.entity';
import { Memo } from './entities/memo.entity';

// Services
import { NovelsService } from './services/novels.service';
import { VolumesService } from './services/volumes.service';
import { ChaptersService } from './services/chapters.service';
import { CharactersService } from './services/characters.service';
import { WorldSettingsService } from './services/world-settings.service';
import { MemosService } from './services/memos.service';

// Controllers
import { NovelsController } from './controllers/novels.controller';
import { VolumesController } from './controllers/volumes.controller';
import { ChaptersController } from './controllers/chapters.controller';
import { CharactersController } from './controllers/characters.controller';
import { WorldSettingsController } from './controllers/world-settings.controller';
import { MemosController } from './controllers/memos.controller';
import { UploadController } from './controllers/upload.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Novel,
      Volume,
      Chapter,
      ChapterVersion,
      Character,
      WorldSetting,
      Memo,
    ]),
  ],
  controllers: [
    NovelsController,
    VolumesController,
    ChaptersController,
    CharactersController,
    WorldSettingsController,
    MemosController,
    UploadController,
  ],
  providers: [
    NovelsService,
    VolumesService,
    ChaptersService,
    CharactersService,
    WorldSettingsService,
    MemosService,
  ],
  exports: [
    NovelsService,
    VolumesService,
    ChaptersService,
    CharactersService,
    WorldSettingsService,
    MemosService,
  ],
})
export class NovelsModule {}
