import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 实体
import { Prompt } from '../prompts/entities/prompt.entity';
import { PromptContent } from '../prompts/entities/prompt-content.entity';
import { Character } from '../novels/entities/character.entity';
import { WorldSetting } from '../novels/entities/world-setting.entity';
import { Memo } from '../novels/entities/memo.entity';
import { Chapter } from '../novels/entities/chapter.entity';

// 服务
import { WritingGenerationService } from './services/writing-generation.service';

// 控制器
import { WritingGenerationController } from './controllers/writing-generation.controller';

// 依赖模块
import { AiModelsModule } from '../ai-models/ai-models.module';
import { MacrosModule } from '../macros/macros.module';
import { PromptsModule } from '../prompts/prompts.module';
import { UsersModule } from '../users/users.module';
import { UserModelPreferencesModule } from '../user-model-preferences/user-model-preferences.module';
import { TokenBalancesModule } from '../token-balances/token-balances.module';

/**
 * AI生成模块
 * 
 * 功能：
 * - AI写作生成
 * - 角色扮演生成（待实现）
 */
@Module({
  imports: [
    // 数据库实体
    TypeOrmModule.forFeature([
      Prompt,
      PromptContent,
      Character,
      WorldSetting,
      Memo,
      Chapter,
    ]),
    
    // 依赖模块
    AiModelsModule,
    MacrosModule,
    PromptsModule,
    UsersModule,
    UserModelPreferencesModule, // 用于获取用户模型偏好设置
    TokenBalancesModule, // 用于字数消耗
  ],
  controllers: [
    WritingGenerationController,
  ],
  providers: [
    WritingGenerationService,
  ],
  exports: [
    WritingGenerationService,
  ],
})
export class GenerationModule {}
