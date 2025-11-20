import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementsService, AnnouncementReadsService } from '../services';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
  ClickLinkDto,
} from '../dto';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { ANNOUNCEMENT_PERMISSIONS } from '../../common/config/permissions.config';

@Controller('/api/v1/announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly readsService: AnnouncementReadsService,
  ) {}

  /**
   * 创建公告（管理员）
   */
  @Post()
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.CREATE)
  async create(
    @Body() createDto: CreateAnnouncementDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.announcementsService.create(createDto, userId);
  }

  /**
   * 查询公告列表（管理端）
   */
  @Get()
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.READ)
  async findAll(@Query() query: QueryAnnouncementDto) {
    return await this.announcementsService.findAll(query);
  }

  /**
   * 获取当前有效公告（用户端）
   */
  @Get('active')
  @OptionalAuth()
  async findActive(@CurrentUser('id') userId?: number) {
    return await this.announcementsService.findActive(userId);
  }

  /**
   * 获取需要弹窗的公告（用户端）
   */
  @Get('popup')
  @OptionalAuth()
  async findPopup(@CurrentUser('id') userId?: number) {
    return await this.announcementsService.findPopup(userId);
  }

  /**
   * 获取未读数量（用户端）
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: number) {
    const count = await this.announcementsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * 查询公告详情
   */
  @Get(':id')
  @OptionalAuth()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.announcementsService.findOne(id);
  }

  /**
   * 更新公告（管理员）
   */
  @Put(':id')
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAnnouncementDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.announcementsService.update(id, updateDto, userId);
  }

  /**
   * 删除公告（管理员）
   */
  @Delete(':id')
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.DELETE)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.announcementsService.remove(id, userId);
    return { message: '删除成功' };
  }

  /**
   * 发布公告（管理员）
   */
  @Post(':id/publish')
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.UPDATE)
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.announcementsService.publish(id, userId);
  }

  /**
   * 立即推送公告（管理员）
   */
  @Post(':id/push')
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.UPDATE)
  async pushNow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.announcementsService.pushNow(id, userId);
    return { message: '推送成功' };
  }

  /**
   * 标记已读（用户端）
   */
  @Post(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.readsService.markAsRead(id, userId);
    return { message: '已标记为已读' };
  }

  /**
   * 记录链接点击（用户端）
   */
  @Post(':id/click')
  async recordClick(
    @Param('id', ParseIntPipe) id: number,
    @Body() clickDto: ClickLinkDto,
    @CurrentUser('id') userId: number,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    await this.readsService.recordClick(
      id,
      userId,
      clickDto,
      ipAddress,
      userAgent,
    );

    return { message: '已记录点击' };
  }

  /**
   * 获取公告统计信息（管理员）
   */
  @Get(':id/stats')
  @RequirePermissions(ANNOUNCEMENT_PERMISSIONS.READ)
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return await this.readsService.getStats(id);
  }
}
