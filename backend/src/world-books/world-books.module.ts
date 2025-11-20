import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldBookActivation } from './entities/world-book-activation.entity';
import { WorldBookScannerService } from './services/world-book-scanner.service';
import { WorldBookBufferService } from './services/world-book-buffer.service';
import { WorldBookTimedEffectsService } from './services/world-book-timed-effects.service';
import { WorldBookRecursiveService } from './services/world-book-recursive.service';
import { WorldBookInclusionGroupService } from './services/world-book-inclusion-group.service';
import { WorldBookBudgetService } from './services/world-book-budget.service';
import { WorldBookMinActivationsService } from './services/world-book-min-activations.service';
import { AdvancedTokenManagerService } from '../prompts/builders/advanced-token-manager.service';

/**
 * 世界书模块（增强版）
 * 提供 SillyTavern 风格的世界书扫描和激活功能
 * 
 * 新增功能：
 *  递归扫描（链式激活）
 *  包含组过滤（互斥选择）
 *  Token预算管理（防止上下文爆炸）
 *  最小激活数保证
 */
@Module({
  imports: [TypeOrmModule.forFeature([WorldBookActivation])],
  providers: [
    // 核心服务
    WorldBookScannerService,
    WorldBookBufferService,
    WorldBookTimedEffectsService,
    
    // 增强功能服务
    WorldBookRecursiveService,
    WorldBookInclusionGroupService,
    WorldBookBudgetService,
    WorldBookMinActivationsService,
    
    // Token管理（从prompts模块复用）
    AdvancedTokenManagerService,
  ],
  exports: [
    WorldBookScannerService,
    WorldBookBufferService,
    WorldBookTimedEffectsService,
    WorldBookRecursiveService,
    WorldBookInclusionGroupService,
    WorldBookBudgetService,
    WorldBookMinActivationsService,
  ],
})
export class WorldBooksModule {}
