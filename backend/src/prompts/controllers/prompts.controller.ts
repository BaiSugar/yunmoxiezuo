import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PromptsService } from '../services/prompts.service';
import { PromptStatsService } from '../services/prompt-stats.service';
import { CreatePromptDto } from '../dto/create-prompt.dto';
import { UpdatePromptDto } from '../dto/update-prompt.dto';
import { QueryPromptDto } from '../dto/query-prompt.dto';
import { QueryMyPromptsDto } from '../dto/query-my-prompts.dto';
import { BatchUpdatePromptsDto } from '../dto/batch-update-prompts.dto';
import { BanPromptDto } from '../dto/ban-prompt.dto';
import { ApprovePromptDto } from '../dto/approve-prompt.dto';
import { RejectPromptReviewDto } from '../dto/reject-prompt-review.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/config/permissions.config';

@ApiTags('提示词管理')
@Controller('api/v1/prompts')
export class PromptsController {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly statsService: PromptStatsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建提示词' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@CurrentUser('id') userId: number, @Body() createPromptDto: CreatePromptDto) {
    return this.promptsService.create(userId, createPromptDto);
  }

  @Get()
  @ApiOperation({ summary: '获取提示词列表（支持筛选和分页）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(
    @Query() queryPromptDto: QueryPromptDto,
    @CurrentUser('id') userId?: number,
  ) {
    return this.promptsService.findAll(queryPromptDto, userId);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的提示词列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findMyPrompts(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryMyPromptsDto,
  ) {
    return this.promptsService.findMyPrompts(
      userId,
      queryDto.categoryId,
      queryDto.page,
      queryDto.pageSize,
    );
  }

  @Get('favorites')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的收藏列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findMyFavorites(
    @CurrentUser('id') userId: number,
    @Query() queryDto: QueryMyPromptsDto,
  ) {
    return this.promptsService.findMyFavorites(userId, queryDto.categoryId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '获取提示词详情',
    description: '支持登录。登录用户可以查看自己的草稿和归档提示词。'
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  @ApiResponse({ status: 403, description: '无权访问（草稿或归档状态）' })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId?: number) {
    // 传递userId，作者访问自己的提示词不计入浏览量
    await this.statsService.incrementViewCount(id, userId);
    return this.promptsService.findOne(id, userId, true);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新提示词' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '无权修改' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updatePromptDto: UpdatePromptDto,
  ) {
    return this.promptsService.update(id, userId, updatePromptDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除提示词' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '无权删除' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.promptsService.remove(id, userId);
  }

  @Get(':id/config')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '获取提示词配置信息',
    description: '返回提示词的配置信息（参数、类型等），不包含敏感的content文本内容。用于前端配置界面。'
  })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    schema: {
      example: {
        id: 1,
        name: '小说续写助手',
        description: '帮助续写小说',
        contents: [
          {
            id: 1,
            name: '系统提示',
            role: 'system',
            type: 'text',
            isEnabled: true,
            parameters: [
              { name: '主角名字', required: true, description: '主角的姓名' }
            ]
          },
          {
            id: 2,
            name: '人物卡',
            role: 'system',
            type: 'character',
            isEnabled: true
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async getPromptConfig(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId?: number,
  ) {
    return this.promptsService.getPromptConfig(id, userId);
  }

  @Post(':id/use')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【已废弃】使用提示词（增加使用次数），请使用流式生成代替' })
  @ApiResponse({ status: 200, description: '记录成功' })
  async usePrompt(@Param('id', ParseIntPipe) id: number) {
    //await this.statsService.incrementUseCount(id);
    return { message: '【已废弃】使用记录成功' };
  }

  @Post(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞提示词' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  @ApiResponse({ status: 400, description: '已经点赞过了' })
  async likePrompt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.statsService.likePrompt(id, userId);
    return { message: '点赞成功' };
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消点赞' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 400, description: '还未点赞' })
  async unlikePrompt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.statsService.unlikePrompt(id, userId);
    return { message: '取消点赞成功' };
  }

  @Post(':id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏提示词' })
  @ApiResponse({ status: 200, description: '收藏成功' })
  @ApiResponse({ status: 400, description: '已经收藏过了' })
  async favoritePrompt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.statsService.favoritePrompt(id, userId);
    return { message: '收藏成功' };
  }

  @Delete(':id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消收藏' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 400, description: '还未收藏' })
  async unfavoritePrompt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.statsService.unfavoritePrompt(id, userId);
    return { message: '取消收藏成功' };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: '获取提示词统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.statsService.getPromptStats(id);
  }

  @Post('batch-update')
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量更新提示词（用户更新自己的，管理员可更新所有）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async batchUpdate(
    @CurrentUser('id') userId: number,
    @Body() batchUpdateDto: BatchUpdatePromptsDto,
    @Req() req: any,
  ) {
    // 检查是否为管理员
    const isAdmin = req.user?.permissions?.includes(PERMISSIONS.PROMPT.MANAGE_ALL) || false;
    return await this.promptsService.batchUpdate(userId, batchUpdateDto, isAdmin);
  }

  @Post(':id/ban')
  @ApiBearerAuth()
  @ApiOperation({ summary: '封禁提示词（管理员）' })
  @ApiResponse({ status: 200, description: '封禁成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async banPrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() banDto: BanPromptDto,
  ) {
    return await this.promptsService.banPrompt(id, banDto);
  }

  @Post(':id/unban')
  @ApiBearerAuth()
  @ApiOperation({ summary: '解封提示词（管理员）' })
  @ApiResponse({ status: 200, description: '解封成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async unbanPrompt(@Param('id', ParseIntPipe) id: number) {
    return await this.promptsService.unbanPrompt(id);
  }

  @Post(':id/submit-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交提示词审核（作者）' })
  @ApiResponse({ status: 200, description: '提交成功' })
  @ApiResponse({ status: 400, description: '该提示词不需要审核' })
  async submitForReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.promptsService.submitForReview(id, userId);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核通过提示词（管理员）' })
  @ApiResponse({ status: 200, description: '审核通过成功' })
  @ApiResponse({ status: 400, description: '该提示词不需要审核' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async approvePrompt(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') reviewerId: number,
    @Body() approveDto: ApprovePromptDto,
  ) {
    return await this.promptsService.approvePrompt(
      id,
      reviewerId,
      approveDto.autoPublish || false,
      approveDto.reviewNote,
    );
  }

  @Post(':id/reject-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '拒绝提示词审核（管理员）' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @ApiResponse({ status: 400, description: '该提示词不需要审核' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async rejectPromptReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') reviewerId: number,
    @Body() rejectDto: RejectPromptReviewDto,
  ) {
    return await this.promptsService.rejectPromptReview(
      id,
      reviewerId,
      rejectDto.rejectReason,
    );
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有提示词列表（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  findAllForAdmin(@Query() queryPromptDto: QueryPromptDto) {
    return this.promptsService.findAllForAdmin(queryPromptDto);
  }
}
