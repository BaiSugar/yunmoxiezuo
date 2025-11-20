import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { AiProvider, AiModel, ApiKey, ModelCategory } from './entities';

// Services
import {
  AiProvidersService,
  AiModelsService,
  ChatCompletionService,
  ModelCategoriesService,
} from './services';
import { ApiKeysService } from './services/api-keys.service';
import { KeyRotationService } from './services/key-rotation.service';

// Controllers
import {
  AiProvidersController,
  AiModelsController,
  ChatCompletionController,
  ModelCategoriesController,
} from './controllers';
import { ApiKeysController } from './controllers/api-keys.controller';

// Adapters
import {
  OpenAIAdapter,
  ClaudeAdapter,
  GoogleAdapter,
  OpenRouterAdapter,
  AdapterFactory,
} from './adapters';

/**
 * AI 模型管理模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([AiProvider, AiModel, ApiKey, ModelCategory])],
  controllers: [
    AiProvidersController,
    AiModelsController,
    ChatCompletionController,
    ApiKeysController,
    ModelCategoriesController,
  ],
  providers: [
    // Services
    AiProvidersService,
    AiModelsService,
    ChatCompletionService,
    ApiKeysService,
    KeyRotationService,
    ModelCategoriesService,
    // Adapters
    OpenAIAdapter,
    ClaudeAdapter,
    GoogleAdapter,
    OpenRouterAdapter,
    AdapterFactory,
  ],
  exports: [
    AiProvidersService,
    AiModelsService,
    ChatCompletionService,
    ApiKeysService,
    KeyRotationService,
    ModelCategoriesService,
    AdapterFactory,
  ],
})
export class AiModelsModule {}
