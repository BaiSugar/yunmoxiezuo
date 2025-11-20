import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditorSetting } from './entities/editor-setting.entity';
import { EditorSettingsService } from './services/editor-settings.service';
import { EditorSettingsController } from './controllers/editor-settings.controller';

/**
 * 编辑器设置模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([EditorSetting])],
  controllers: [EditorSettingsController],
  providers: [EditorSettingsService],
  exports: [EditorSettingsService],
})
export class EditorSettingsModule {}

