import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookCreationTask, BookCreationStage, OutlineNode } from './entities';
import { Novel } from '../novels/entities/novel.entity';
import { Volume } from '../novels/entities/volume.entity';
import { Chapter } from '../novels/entities/chapter.entity';
import { Character } from '../novels/entities/character.entity';
import { WorldSetting } from '../novels/entities/world-setting.entity';
import { Memo } from '../novels/entities/memo.entity';
import { Prompt } from '../prompts/entities/prompt.entity';
import { PromptGroup } from '../prompt-groups/entities/prompt-group.entity';
import { BookCreationController } from './controllers/book-creation.controller';
import { BookCreationService } from './services/book-creation.service';
import { StageExecutorService } from './services/stage-executor.service';
import { OutlineBuilderService } from './services/outline-builder.service';
import { ContentGeneratorService } from './services/content-generator.service';
import { ReviewOptimizerService } from './services/review-optimizer.service';
import { StepByStepGeneratorService } from './services/step-by-step-generator.service';
import { CharacterWorldviewExtractorService } from './services/character-worldview-extractor.service';
import { GenerationModule } from '../generation/generation.module';
import { TokenBalancesModule } from '../token-balances/token-balances.module';
import { NovelsModule } from '../novels/novels.module';
import { PromptsModule } from '../prompts/prompts.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { WebSocketGateway } from '../websocket/websocket.gateway';

/**
 * 一键成书模块
 * 提供从想法到成书的完整AI辅助创作流程
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookCreationTask,
      BookCreationStage,
      OutlineNode,
      Novel,
      Volume,
      Chapter,
      Character,
      WorldSetting,
      Memo,
      Prompt,
      PromptGroup,
    ]),
    GenerationModule,
    TokenBalancesModule,
    NovelsModule,
    PromptsModule,
    forwardRef(() => WebSocketModule),
  ],
  controllers: [BookCreationController],
  providers: [
    BookCreationService,
    StageExecutorService,
    OutlineBuilderService,
    ContentGeneratorService,
    ReviewOptimizerService,
    StepByStepGeneratorService,
    CharacterWorldviewExtractorService,
  ],
  exports: [BookCreationService],
})
export class BookCreationModule implements OnModuleInit {
  constructor(
    private readonly bookCreationService: BookCreationService,
    private readonly webSocketGateway: WebSocketGateway,
  ) {
    console.log('[BookCreationModule] 构造函数调用');
  }

  onModuleInit() {
    console.log('[BookCreationModule] onModuleInit - 开始注入服务到WebSocketGateway');
    console.log('[BookCreationModule] bookCreationService存在:', !!this.bookCreationService);
    console.log('[BookCreationModule] webSocketGateway存在:', !!this.webSocketGateway);
    
    // 注入BookCreationService到WebSocketGateway
    this.webSocketGateway.setBookCreationService(this.bookCreationService);
    
    console.log('[BookCreationModule] ✓ BookCreationService已注入到WebSocketGateway');
  }
}

