import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatHistoriesService } from '../services/chat-histories.service';
import { ChatExportService } from '../services/chat-export.service';
import { ChatImportService } from '../services/chat-import.service';
import {
  CreateChatDto,
  UpdateChatDto,
  QueryChatsDto,
  ImportChatDto,
} from '../dto';
import { ExportFormat } from '../enums';

/**
 * 聊天历史控制器
 */
@ApiTags('聊天历史')
@ApiBearerAuth()
@Controller('/api/v1/chat-histories')
export class ChatHistoriesController {
  constructor(
    private readonly chatHistoriesService: ChatHistoriesService,
    private readonly chatExportService: ChatExportService,
    private readonly chatImportService: ChatImportService,
  ) {}

  /**
   * 创建聊天
   */
  @Post()
  @ApiOperation({ summary: '创建聊天' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@CurrentUser('id') userId: number, @Body() dto: CreateChatDto) {
    return await this.chatHistoriesService.create(userId, dto);
  }

  /**
   * 查询聊天列表
   */
  @Get()
  @ApiOperation({ summary: '查询聊天列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(
    @CurrentUser('id') userId: number,
    @Query() query: QueryChatsDto,
  ) {
    return await this.chatHistoriesService.findAll(userId, query);
  }

  /**
   * 获取聊天详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取聊天详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.chatHistoriesService.findOne(userId, id);
  }

  /**
   * 更新聊天
   */
  @Put(':id')
  @ApiOperation({ summary: '更新聊天' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatDto,
  ) {
    return await this.chatHistoriesService.update(userId, id, dto);
  }

  /**
   * 删除聊天
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除聊天' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async delete(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.chatHistoriesService.delete(userId, id);
  }

  /**
   * 批量删除聊天
   */
  @Post('batch-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '批量删除聊天' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async batchDelete(
    @CurrentUser('id') userId: number,
    @Body('ids') ids: number[],
  ) {
    await this.chatHistoriesService.batchDelete(userId, ids);
  }

  /**
   * 获取聊天统计
   */
  @Get('stats/summary')
  @ApiOperation({ summary: '获取聊天统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStats(@CurrentUser('id') userId: number) {
    return await this.chatHistoriesService.getStats(userId);
  }

  /**
   * 导出聊天
   */
  @Get(':id/export')
  @ApiOperation({ summary: '导出聊天' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async export(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: ExportFormat = ExportFormat.JSONL,
    @Res() res: Response,
  ) {
    const { data, filename, mimeType } = await this.chatExportService.export(
      userId,
      id,
      format,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }

  /**
   * 导入聊天
   */
  @Post('import')
  @ApiOperation({ summary: '导入聊天' })
  @ApiResponse({ status: 201, description: '导入成功' })
  async import(
    @CurrentUser('id') userId: number,
    @Body() dto: ImportChatDto,
  ) {
    return await this.chatImportService.import(
      userId,
      dto.data,
      dto.source,
      dto.characterCardId,
    );
  }
}
