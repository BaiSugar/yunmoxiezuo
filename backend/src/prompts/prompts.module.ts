import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { PromptContent } from './entities/prompt-content.entity';
import { PromptLike } from './entities/prompt-like.entity';
import { PromptFavorite } from './entities/prompt-favorite.entity';
import { Category } from './entities/category.entity';
import { PromptPermission } from './entities/prompt-permission.entity';
import { PromptApplication } from './entities/prompt-application.entity';
import { PromptReport } from './entities/prompt-report.entity';
import { PromptsController } from './controllers/prompts.controller';
import { CategoriesController } from './controllers/categories.controller';
import { PromptPermissionsController } from './controllers/prompt-permissions.controller';
import { PromptApplicationsController } from './controllers/prompt-applications.controller';
import { PromptReportsController } from './controllers/prompt-reports.controller';
import { PromptsService } from './services/prompts.service';
import { CategoryService } from './services/category.service';
import { PromptPermissionService } from './services/prompt-permission.service';
import { PromptApplicationService } from './services/prompt-application.service';
import { PromptStatsService } from './services/prompt-stats.service';
import { PromptReportService } from './services/prompt-report.service';
import { PromptBuilderController } from './controllers/prompt-builder.controller';
import { PromptBuilderService } from './builders/prompt-builder.service';
import { ComponentCollectorService } from './builders/component-collector.service';
import { PositionGrouperService } from './builders/position-grouper.service';
import { TokenManagerService } from './builders/token-manager.service';
import { AdvancedTokenManagerService } from './builders/advanced-token-manager.service';
import { MessageAssemblerService } from './builders/message-assembler.service';
import { FormatConverterService } from './builders/format-converter.service';
import { PromptInjectionGuard } from './guards/prompt-injection.guard';
import { InjectionDetectorService } from './guards/injection-detector.service';
import { InputSanitizerService } from './guards/input-sanitizer.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prompt,
      PromptContent,
      PromptLike,
      PromptFavorite,
      Category,
      PromptPermission,
      PromptApplication,
      PromptReport,
    ]),
    NotificationsModule,
    WebSocketModule,
    UsersModule,
  ],
  controllers: [
    // ⚠️ 注意：更具体的路由（如 /prompts/reports）必须在更通用的路由（如 /prompts/:id）之前注册
    PromptReportsController,    // /prompts/reports
    PromptApplicationsController, // /prompts/:promptId/apply
    PromptPermissionsController,  // /prompts/:promptId/permissions
    PromptBuilderController,      // /prompts/build
    CategoriesController,
    PromptsController,           // /prompts/:id (动态路由，必须放最后)
  ],
  providers: [
    PromptsService,
    CategoryService,
    PromptPermissionService,
    PromptApplicationService,
    PromptStatsService,
    PromptReportService,
    // 构建器服务
    PromptBuilderService,
    ComponentCollectorService,
    PositionGrouperService,
    TokenManagerService,
    AdvancedTokenManagerService,
    MessageAssemblerService,
    FormatConverterService,
    // 注入防护服务
    PromptInjectionGuard,
    InjectionDetectorService,
    InputSanitizerService,
  ],
  exports: [
    PromptsService,
    CategoryService,
    PromptPermissionService,
    PromptApplicationService,
    PromptStatsService,
    PromptBuilderService,
    TokenManagerService,
    AdvancedTokenManagerService,
    // 注入防护服务（导出供其他模块使用）
    PromptInjectionGuard,
    InjectionDetectorService,
    InputSanitizerService,
  ],
})
export class PromptsModule implements OnModuleInit {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly websocketGateway: WebSocketGateway,
  ) {}

  onModuleInit() {
    // 注入WebSocketGateway到PromptsService
    this.promptsService.setWebSocketGateway(this.websocketGateway);
  }
}
