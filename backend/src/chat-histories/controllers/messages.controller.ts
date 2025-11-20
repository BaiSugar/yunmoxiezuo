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
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto, UpdateMessageDto, CreateSwipeDto } from '../dto';

/**
 * 消息控制器
 */
@ApiTags('消息管理')
@ApiBearerAuth()
@Controller('/api/v1/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * 创建消息
   */
  @Post()
  @ApiOperation({ summary: '创建消息' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateMessageDto,
  ) {
    return await this.messagesService.create(userId, dto);
  }

  /**
   * 批量创建消息
   */
  @Post('batch')
  @ApiOperation({ summary: '批量创建消息' })
  @ApiResponse({ status: 201, description: '批量创建成功' })
  async batchCreate(
    @CurrentUser('id') userId: number,
    @Body() body: { chatId: number; messages: Omit<CreateMessageDto, 'chatId'>[] },
  ) {
    return await this.messagesService.batchCreate(
      userId,
      body.chatId,
      body.messages,
    );
  }

  /**
   * 查询聊天的消息列表
   */
  @Get('chat/:chatId')
  @ApiOperation({ summary: '查询聊天的消息列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByChatId(
    @CurrentUser('id') userId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return await this.messagesService.findByChatId(userId, chatId, page, limit);
  }

  /**
   * 获取消息详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取消息详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.messagesService.findOne(userId, id);
  }

  /**
   * 更新消息
   */
  @Put(':id')
  @ApiOperation({ summary: '更新消息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMessageDto,
  ) {
    return await this.messagesService.update(userId, id, dto);
  }

  /**
   * 删除消息
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除消息' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async delete(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.messagesService.delete(userId, id);
  }

  /**
   * 删除指定消息及之后的所有消息
   */
  @Delete(':id/from')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除指定消息及之后的所有消息' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteFrom(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.messagesService.deleteFrom(userId, id);
  }

  /**
   * 为消息添加新的Swipe版本
   */
  @Post(':id/swipes')
  @ApiOperation({ summary: '添加Swipe版本' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async addSwipe(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSwipeDto,
  ) {
    return await this.messagesService.addSwipe(userId, id, dto);
  }

  /**
   * 切换Swipe版本
   */
  @Put(':id/swipes/:swipeIndex')
  @ApiOperation({ summary: '切换Swipe版本' })
  @ApiResponse({ status: 200, description: '切换成功' })
  async switchSwipe(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('swipeIndex', ParseIntPipe) swipeIndex: number,
  ) {
    return await this.messagesService.switchSwipe(userId, id, swipeIndex);
  }

  /**
   * 删除Swipe版本
   */
  @Delete(':id/swipes/:swipeIndex')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除Swipe版本' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteSwipe(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('swipeIndex', ParseIntPipe) swipeIndex: number,
  ) {
    await this.messagesService.deleteSwipe(userId, id, swipeIndex);
  }
}
