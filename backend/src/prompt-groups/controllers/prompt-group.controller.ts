import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PromptGroupService } from '../services/prompt-group.service';
import {
  CreatePromptGroupDto,
  UpdatePromptGroupDto,
  QueryPromptGroupsDto,
  ApplyPromptGroupDto,
  ReviewPromptGroupApplicationDto,
} from '../dto';

/**
 * 提示词组控制器
 */
@ApiTags('提示词组管理')
@Controller('api/v1/prompt-groups')
export class PromptGroupController {
  constructor(private readonly promptGroupService: PromptGroupService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建提示词组' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未认证' })
  async create(@CurrentUser('id') userId: number, @Body() dto: CreatePromptGroupDto) {
    return this.promptGroupService.create(userId, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取提示词组列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query() dto: QueryPromptGroupsDto,
    @CurrentUser('id') userId?: number,
  ) {
    return this.promptGroupService.findAll(dto, userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的提示词组列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyGroups(@CurrentUser('id') userId: number) {
    return this.promptGroupService.findAll({ userId }, userId);
  }

  @Get('applications/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyApplications(@CurrentUser('id') userId: number) {
    return this.promptGroupService.getMyApplications(userId);
  }

  @Get('applications/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取待我审核的申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingApplications(@CurrentUser('id') userId: number) {
    return this.promptGroupService.getPendingApplications(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取提示词组详情' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '提示词组不存在' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId?: number,
  ) {
    return this.promptGroupService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新提示词组' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未认证' })
  @ApiResponse({ status: 403, description: '无权修改' })
  @ApiResponse({ status: 404, description: '提示词组不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdatePromptGroupDto,
  ) {
    return this.promptGroupService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除提示词组' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未认证' })
  @ApiResponse({ status: 403, description: '无权删除' })
  @ApiResponse({ status: 404, description: '提示词组不存在' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.promptGroupService.remove(id, userId);
    return { message: '删除成功' };
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '申请使用提示词组' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 201, description: '申请成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未认证' })
  async apply(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: ApplyPromptGroupDto,
  ) {
    return this.promptGroupService.apply(id, userId, dto);
  }

  @Patch('applications/:applicationId/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核申请' })
  @ApiParam({ name: 'applicationId', description: '申请ID' })
  @ApiResponse({ status: 200, description: '审核成功' })
  @ApiResponse({ status: 401, description: '未认证' })
  @ApiResponse({ status: 403, description: '无权审核' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async reviewApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: ReviewPromptGroupApplicationDto,
  ) {
    return this.promptGroupService.reviewApplication(applicationId, userId, dto);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞提示词组' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  @ApiResponse({ status: 400, description: '已点赞' })
  @ApiResponse({ status: 401, description: '未认证' })
  async like(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.promptGroupService.like(id, userId);
    return { message: '点赞成功' };
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消点赞' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 400, description: '尚未点赞' })
  @ApiResponse({ status: 401, description: '未认证' })
  async unlike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.promptGroupService.unlike(id, userId);
    return { message: '取消点赞成功' };
  }

  @Post(':id/use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '记录使用提示词组' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '记录成功' })
  async recordUse(@Param('id', ParseIntPipe) id: number) {
    await this.promptGroupService.recordUse(id);
    return { message: '使用记录成功' };
  }

  @Get(':id/parameters')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取提示词组的所有参数' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '提示词组不存在' })
  async getParameters(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId?: number,
  ) {
    return this.promptGroupService.getParameters(id, userId);
  }

  @Get(':id/check-permission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查是否有权限使用提示词组' })
  @ApiParam({ name: 'id', description: '提示词组ID' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async checkPermission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    const hasPermission = await this.promptGroupService.checkPermission(id, userId);
    return { hasPermission };
  }
}

