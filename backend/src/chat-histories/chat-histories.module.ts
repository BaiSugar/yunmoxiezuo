import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatHistory, Message, Swipe, GroupChat, GroupMember } from './entities';
import {
  ChatHistoriesService,
  MessagesService,
  SwipesService,
  ChatExportService,
  ChatImportService,
  GroupChatsService,
  SessionsService,
  SessionBackupService,
} from './services';
import {
  ChatHistoriesController,
  MessagesController,
  GroupChatsController,
  SessionsController,
} from './controllers';
import { PromptsModule } from '../prompts/prompts.module';

/**
 * 聊天历史模块
 * 负责管理用户与角色的对话历史记录、群聊和会话管理
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistory, Message, Swipe, GroupChat, GroupMember]),
    PromptsModule,
  ],
  controllers: [
    ChatHistoriesController,
    MessagesController,
    GroupChatsController,
    SessionsController,
  ],
  providers: [
    // 核心服务
    ChatHistoriesService,
    MessagesService,
    SwipesService,
    // 导入导出服务
    ChatExportService,
    ChatImportService,
    // 群聊和会话管理
    GroupChatsService,
    SessionsService,
    SessionBackupService,
  ],
  exports: [
    ChatHistoriesService,
    MessagesService,
    SwipesService,
    GroupChatsService,
    SessionsService,
    SessionBackupService,
  ],
})
export class ChatHistoriesModule {}
