import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/notification.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('通知管理')
@Controller('/api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  @ApiResponse({ status: 200, description: '返回通知列表' })
  async findAll(
    @CurrentUser('id') userId: number,
    @Query() query: QueryNotificationDto,
  ) {
    return await this.notificationsService.findByUser(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读数量' })
  @ApiResponse({ status: 200, description: '返回未读数量' })
  async getUnreadCount(@CurrentUser('id') userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.notificationsService.markAsRead(id, userId);
    return { message: '已标记为已读' };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: '全部标记已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAllAsRead(@CurrentUser('id') userId: number) {
    await this.notificationsService.markAllAsRead(userId);
    return { message: '已全部标记为已读' };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.notificationsService.remove(id, userId);
    return { message: '删除成功' };
  }

  @Delete('clear-read')
  @ApiOperation({ summary: '清空已读通知' })
  @ApiResponse({ status: 200, description: '清空成功' })
  async clearRead(@CurrentUser('id') userId: number) {
    await this.notificationsService.clearRead(userId);
    return { message: '已清空已读通知' };
  }
}

