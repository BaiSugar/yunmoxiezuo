import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { LogsModule } from './logs/logs.module';
import { CommonModule } from './common/common.module';
import { NovelsModule } from './novels/novels.module';
import { PromptsModule } from './prompts/prompts.module';
import { AiModelsModule } from './ai-models/ai-models.module';
import { WorldBooksModule } from './world-books/world-books.module';
import { CharacterCardsModule } from './character-cards/character-cards.module';
import { MacrosModule } from './macros/macros.module';
import { ChatHistoriesModule } from './chat-histories/chat-histories.module';
import { GenerationModule } from './generation/generation.module';
import { MembershipsModule } from './memberships/memberships.module';
import { TokenPackagesModule } from './token-packages/token-packages.module';
import { TokenBalancesModule } from './token-balances/token-balances.module';
import { RedemptionCodesModule } from './redemption-codes/redemption-codes.module';
import { OrdersModule } from './orders/orders.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { UserModelPreferencesModule } from './user-model-preferences/user-model-preferences.module';
import { WebSocketModule } from './websocket/websocket.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ToolsModule } from './tools/tools.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { EmailModule } from './email/email.module';
import { EditorSettingsModule } from './editor-settings/editor-settings.module';
import { FontsModule } from './fonts/fonts.module';
import { BookCreationModule } from './book-creation/book-creation.module';
import { PromptGroupsModule } from './prompt-groups/prompt-groups.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),

    // 业务模块
    CommonModule,
    LogsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    NovelsModule,
    PromptsModule,
    AiModelsModule,
    WorldBooksModule,
    CharacterCardsModule,
    MacrosModule,
    ChatHistoriesModule,
    GenerationModule,
    MembershipsModule,
    TokenPackagesModule,
    TokenBalancesModule,
    RedemptionCodesModule,
    OrdersModule,
    AnnouncementsModule,
    UserModelPreferencesModule,
    NotificationsModule,
    WebSocketModule,
    ToolsModule,
    SystemSettingsModule,
    EmailModule,
    EditorSettingsModule,
    FontsModule,
    BookCreationModule,
    PromptGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
