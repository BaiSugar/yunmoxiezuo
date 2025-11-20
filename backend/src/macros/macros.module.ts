import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 导入所有服务
import { MacroReplacerService } from './services/macro-replacer.service';
import { CharacterMacroService } from './services/character-macro.service';
import { TimeMacroService } from './services/time-macro.service';
import { ConversationMacroService } from './services/conversation-macro.service';
import { RandomMacroService } from './services/random-macro.service';
import { TextMacroService } from './services/text-macro.service';
import { VariableMacroService } from './services/variable-macro.service';
import { MentionMacroService } from './services/mention-macro.service';

// 导入实体
import { Character } from '../novels/entities/character.entity';
import { WorldSetting } from '../novels/entities/world-setting.entity';
import { Memo } from '../novels/entities/memo.entity';
import { Chapter } from '../novels/entities/chapter.entity';

/**
 * 宏（参数替换）系统模块
 * 
 * 提供了完整的 SillyTavern 风格宏替换功能
 * 支持角色、时间、对话、随机、文本、变量、@引用等多种宏类型
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Character, WorldSetting, Memo, Chapter]),
  ],
  providers: [
    // 主服务
    MacroReplacerService,
    
    // 各类型宏处理服务
    CharacterMacroService,
    TimeMacroService,
    ConversationMacroService,
    RandomMacroService,
    TextMacroService,
    VariableMacroService,
    MentionMacroService,
  ],
  exports: [
    // 只导出主服务，其他服务作为内部实现
    MacroReplacerService,
  ],
})
export class MacrosModule {}
