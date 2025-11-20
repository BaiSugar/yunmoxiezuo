import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionsService, SessionBackupService } from '../services';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * 会话管理控制器
 * 跨聊天和群聊的高级功能
 */
@ApiTags('会话管理')
@ApiBearerAuth()
@Controller('/api/v1/sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly backupService: SessionBackupService,
  ) {}

  @Get('recent')
  @ApiOperation({ summary: '获取最近的会话列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量', example: 10 })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getRecentSessions(
    @CurrentUser('id') userId: number,
    @Query('limit') limit?: number,
  ) {
    return await this.sessionsService.getRecentSessions(userId, limit || 10);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索会话' })
  @ApiQuery({ name: 'q', required: true, type: String, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchSessions(
    @CurrentUser('id') userId: number,
    @Query('q') query: string,
  ) {
    return await this.sessionsService.searchSessions(userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取会话统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStats(@CurrentUser('id') userId: number) {
    return await this.sessionsService.getSessionStats(userId);
  }

  @Post('backup/chat/:chatId')
  @ApiOperation({ summary: '备份普通聊天' })
  @ApiResponse({ status: 200, description: '备份成功' })
  async backupChat(
    @CurrentUser('id') userId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return await this.backupService.backupChat(userId, chatId);
  }

  @Post('backup/group/:groupId')
  @ApiOperation({ summary: '备份群聊' })
  @ApiResponse({ status: 200, description: '备份成功' })
  async backupGroup(
    @CurrentUser('id') userId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return await this.backupService.backupGroupChat(userId, groupId);
  }

  @Post('restore')
  @ApiOperation({ summary: '从备份恢复会话' })
  @ApiResponse({ status: 201, description: '恢复成功，返回新会话ID' })
  async restoreFromBackup(
    @CurrentUser('id') userId: number,
    @Body() backup: any,
  ) {
    const newId = await this.backupService.restoreFromBackup(userId, backup);
    return {
      message: '恢复成功',
      id: newId,
      type: backup.type,
    };
  }
}
