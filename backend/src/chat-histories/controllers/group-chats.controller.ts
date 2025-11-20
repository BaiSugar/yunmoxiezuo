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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GroupChatsService } from '../services';
import {
  CreateGroupChatDto,
  UpdateGroupChatDto,
  QueryGroupChatsDto,
  AddGroupMemberDto,
} from '../dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * 群聊管理控制器
 */
@ApiTags('群聊管理')
@ApiBearerAuth()
@Controller('/api/v1/group-chats')
export class GroupChatsController {
  constructor(private readonly groupChatsService: GroupChatsService) {}

  @Post()
  @ApiOperation({ summary: '创建群聊' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@CurrentUser('id') userId: number, @Body() dto: CreateGroupChatDto) {
    return await this.groupChatsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取群聊列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@CurrentUser('id') userId: number, @Query() query: QueryGroupChatsDto) {
    return await this.groupChatsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取群聊详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.groupChatsService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新群聊信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupChatDto,
  ) {
    return await this.groupChatsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除群聊' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async delete(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    await this.groupChatsService.delete(userId, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档群聊' })
  @ApiResponse({ status: 200, description: '归档成功' })
  async archive(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.groupChatsService.archive(userId, id, true);
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: '取消归档群聊' })
  @ApiResponse({ status: 200, description: '取消归档成功' })
  async unarchive(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return await this.groupChatsService.archive(userId, id, false);
  }

  @Post(':id/members')
  @ApiOperation({ summary: '添加群聊成员' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addMember(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddGroupMemberDto,
  ) {
    return await this.groupChatsService.addMember(userId, id, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除群聊成员' })
  @ApiResponse({ status: 204, description: '移除成功' })
  async removeMember(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    await this.groupChatsService.removeMember(userId, id, memberId);
  }

  @Put(':id/members/:memberId/toggle')
  @ApiOperation({ summary: '启用/禁用群聊成员' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async toggleMember(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('isEnabled') isEnabled: boolean,
  ) {
    return await this.groupChatsService.toggleMember(userId, id, memberId, isEnabled);
  }

  @Put(':id/members/order')
  @ApiOperation({ summary: '更新成员显示顺序' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMemberOrder(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() orders: { memberId: number; displayOrder: number }[],
  ) {
    await this.groupChatsService.updateMemberOrder(userId, id, orders);
    return { message: '更新成功' };
  }
}
